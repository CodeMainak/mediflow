import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";
import { IUser } from "../models/User";
import { PrescriptionUpload, IPrescriptionUpload } from "../models/PrescriptionUpload";
import { PrescriptionFile } from "../models/PrescriptionFile";
import { reserveAiCall, recordAiOutcome } from "../services/aiBudget";
import { extractPrescription, Extraction } from "../services/prescriptionExtraction";
import { suggestSpecialties, VerifiedDetails } from "../services/specialtyNavigation";

export const CONSENT_VERSION = "2026-11-v1";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DAY_MS = 24 * 60 * 60 * 1000;
const FILE_RETENTION_MS = DAY_MS; // the original goes once verified, or after this
const RECORD_RETENTION_MS = 30 * DAY_MS;
const MAX_ACTIVE_FILES = 5; // a free-tier database shouldn't fill up with one patient's scans
const EXTRACTION_LOCK_MS = 60 * 1000; // a crashed extraction mustn't block retries forever
const MAX_VERIFIED_ITEMS = 20;

/**
 * Identifies a file by its first bytes. The filename and declared type are
 * chosen by the client, so neither can be trusted.
 */
export function detectFileType(data: Buffer): "image/jpeg" | "image/png" | "application/pdf" | null {
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
    if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
    if (data.length >= 5 && data.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
    return null;
}

/**
 * Every lookup goes through this filter. Another patient's upload is simply not
 * found, so a 404 doesn't even confirm that the id exists.
 */
function ownedBy(req: AuthRequest): { _id: string; patient: unknown } | null {
    const id = String(req.params["id"]);
    if (!mongoose.isValidObjectId(id)) return null;
    return { _id: id, patient: (req.user as IUser)._id };
}

function serialize(upload: IPrescriptionUpload) {
    return {
        _id: upload._id,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        status: upload.status,
        extractionFailure: upload.extractionFailure,
        extraction: upload.extraction,
        verified: upload.verified,
        navigation: upload.navigation,
        hasFile: !!upload.fileExpiresAt && upload.fileExpiresAt.getTime() > Date.now(),
        fileExpiresAt: upload.fileExpiresAt,
        expiresAt: upload.expiresAt,
        createdAt: upload.createdAt,
    };
}

/** Counts and reasons only: this line must never carry document text or who it belongs to. */
function logExtraction(entry: { outcome: string; status?: number; latencyMs: number; medications?: number }): void {
    console.info(JSON.stringify({ event: "prescription_extraction", ...entry }));
}

export const createUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.body?.consent !== "true") {
            res.status(400).json({ msg: "Please confirm your consent before uploading." });
            return;
        }
        if (!req.file) {
            res.status(400).json({ msg: "Please choose a file to upload." });
            return;
        }
        const mimeType = detectFileType(req.file.buffer);
        if (!mimeType) {
            res.status(415).json({ msg: "Only JPG, PNG and PDF files are supported." });
            return;
        }

        const patient = (req.user as IUser)._id;
        const activeFiles = await PrescriptionFile.countDocuments({ patient });
        if (activeFiles >= MAX_ACTIVE_FILES) {
            res.status(429).json({ msg: "You have several uploads waiting. Finish or delete one before adding another." });
            return;
        }

        const now = Date.now();
        const fileExpiresAt = new Date(now + FILE_RETENTION_MS);
        const upload = await PrescriptionUpload.create({
            patient,
            mimeType,
            sizeBytes: req.file.size,
            consentVersion: CONSENT_VERSION,
            consentedAt: new Date(now),
            fileExpiresAt,
            expiresAt: new Date(now + RECORD_RETENTION_MS),
        });
        await PrescriptionFile.create({ upload: upload._id, patient, data: req.file.buffer, mimeType, expiresAt: fileExpiresAt });

        res.status(201).json(serialize(upload));
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

export const listUploads = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const uploads = await PrescriptionUpload.find({ patient: (req.user as IUser)._id }).sort({ createdAt: -1 }).limit(20);
        res.json(uploads.map(serialize));
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

export const getUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter = ownedBy(req);
        const upload = filter && (await PrescriptionUpload.findOne(filter));
        if (!upload) {
            res.status(404).json({ msg: "Upload not found" });
            return;
        }
        res.json(serialize(upload));
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

export const getUploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter = ownedBy(req);
        const file = filter && (await PrescriptionFile.findOne({ upload: filter._id, patient: filter.patient }));
        if (!file) {
            res.status(404).json({ msg: "File not found" });
            return;
        }
        res.set({
            "Content-Type": file.mimeType,
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        });
        res.send(file.data);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

function failureFor(extraction: Extraction): string | null {
    if (!extraction.isPrescription) return "not_a_prescription";
    if (extraction.medications.length === 0 && extraction.findings.length === 0) return "unreadable";
    return null;
}

export const extractUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    const startedAt = Date.now();
    try {
        const filter = ownedBy(req);
        if (!filter) {
            res.status(404).json({ msg: "Upload not found" });
            return;
        }

        // Atomic claim, so a double click or a retry can't pay for the same document twice.
        const upload = await PrescriptionUpload.findOneAndUpdate(
            {
                ...filter,
                status: { $in: ["uploaded", "needs_manual"] },
                $or: [{ extractionStartedAt: null }, { extractionStartedAt: { $lt: new Date(startedAt - EXTRACTION_LOCK_MS) } }],
            },
            { $set: { extractionStartedAt: new Date(startedAt) } },
            { new: true }
        );
        if (!upload) {
            const existing = await PrescriptionUpload.findOne(filter);
            if (!existing) res.status(404).json({ msg: "Upload not found" });
            else if (existing.status === "uploaded" || existing.status === "needs_manual") res.status(409).json({ msg: "This document is already being read." });
            else res.json(serialize(existing)); // already extracted: no need to pay again
            return;
        }

        const finish = async (outcome: string, tokens = 0, status?: number, medications?: number) => {
            upload.extractionStartedAt = null;
            await upload.save();
            recordAiOutcome("prescription_extraction", outcome, tokens);
            logExtraction({ outcome, status, latencyMs: Date.now() - startedAt, medications });
            res.json(serialize(upload));
        };
        const needsManual = (reason: string) => {
            upload.status = "needs_manual";
            upload.extractionFailure = reason;
        };

        const file = await PrescriptionFile.findOne({ upload: upload._id, patient: filter.patient });
        if (!file) {
            needsManual("file_expired");
            await finish("file_expired");
            return;
        }

        const budget = await reserveAiCall("prescription_extraction", String(filter.patient));
        if (budget !== "allowed") {
            needsManual(budget);
            await finish(budget);
            return;
        }

        const result = await extractPrescription(file.data, file.mimeType);
        if (!result.ok) {
            needsManual("extraction_unavailable");
            await finish(result.reason, 0, result.status);
            return;
        }

        upload.extraction = result.extraction;
        const failure = failureFor(result.extraction);
        if (failure) {
            needsManual(failure);
        } else {
            upload.status = "extracted";
            upload.extractionFailure = null;
        }
        await finish(failure ?? "ok", result.tokens, undefined, result.extraction.medications.length);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

function validateVerified(body: any): VerifiedDetails | string {
    if (body?.confirmed !== true) return "Please confirm that you've checked these details against your prescription.";
    const { medications, findings } = body;
    if (!Array.isArray(medications) || !Array.isArray(findings)) return "Invalid details.";
    if (medications.length > MAX_VERIFIED_ITEMS || findings.length > MAX_VERIFIED_ITEMS) return "Too many items.";

    const cleanMedications: VerifiedDetails["medications"] = [];
    for (const m of medications) {
        if (typeof m?.name !== "string" || !m.name.trim() || m.name.length > 80) return "Each medicine needs a name of up to 80 characters.";
        cleanMedications.push({ name: m.name.trim() }); // only the name: doses aren't collected
    }
    const cleanFindings: string[] = [];
    for (const f of findings) {
        if (typeof f !== "string" || !f.trim() || f.length > 200) return "Each note can be up to 200 characters.";
        cleanFindings.push(f.trim());
    }
    return { medications: cleanMedications, findings: cleanFindings };
}

export const verifyUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter = ownedBy(req);
        const upload = filter && (await PrescriptionUpload.findOne(filter));
        if (!filter || !upload) {
            res.status(404).json({ msg: "Upload not found" });
            return;
        }
        const details = validateVerified(req.body);
        if (typeof details === "string") {
            res.status(400).json({ msg: details });
            return;
        }

        upload.verified = details;
        upload.navigation = suggestSpecialties(details);
        upload.status = "verified";
        upload.extractionFailure = null;
        upload.fileExpiresAt = null;
        await upload.save();
        // The patient has what they need, so the original document has no further purpose.
        await PrescriptionFile.deleteOne({ upload: upload._id, patient: filter.patient });

        res.json(serialize(upload));
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

export const deleteUpload = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter = ownedBy(req);
        const upload = filter && (await PrescriptionUpload.findOneAndDelete(filter));
        if (!filter || !upload) {
            res.status(404).json({ msg: "Upload not found" });
            return;
        }
        await PrescriptionFile.deleteOne({ upload: upload._id, patient: filter.patient });
        res.json({ msg: "Deleted" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};
