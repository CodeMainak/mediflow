import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import { protect, onlyRole } from "../middlewares/authMiddleware";
import { uploadLimiter } from "../middlewares/securityMiddleware";
import {
    MAX_FILE_BYTES,
    createUpload,
    listUploads,
    getUpload,
    getUploadFile,
    extractUpload,
    verifyUpload,
    deleteUpload,
} from "../controllers/prescriptionAssistantController";

const router = express.Router();

// Memory, not disk: a rejected file never touches storage, and an accepted one
// only goes to the private collection.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

const receiveFile = (req: Request, res: Response, next: NextFunction): void => {
    upload.single("file")(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError) {
            const tooLarge = err.code === "LIMIT_FILE_SIZE";
            res.status(tooLarge ? 413 : 400).json({ msg: tooLarge ? "Files can be up to 5 MB." : "Please upload one file." });
            return;
        }
        if (err) {
            next(err);
            return;
        }
        next();
    });
};

// Patients only: staff have no route to these documents.
router.use(protect, onlyRole(["Patient"]));

router.post("/uploads", uploadLimiter, receiveFile, createUpload);
router.get("/uploads", listUploads);
router.get("/uploads/:id", getUpload);
router.get("/uploads/:id/file", getUploadFile);
router.post("/uploads/:id/extract", extractUpload);
router.put("/uploads/:id/verification", verifyUpload);
router.delete("/uploads/:id", deleteUpload);

export default router;
