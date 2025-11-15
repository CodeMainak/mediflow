import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { MedicalRecord } from "../models/MedicalRecord";
import { IUser } from "../models/User";

// Doctor creates a record
export const createMedicalRecord = async (req: AuthRequest, res: Response) => {
    try {
        const doctor = req.user as IUser;
        const { patientId, diagnosis, prescriptions, notes } = req.body;

        const record = await MedicalRecord.create({
            patient: patientId,
            doctor: doctor._id,
            diagnosis,
            prescriptions,
            notes
        });

        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// Patient fetches their own records
export const getMyMedicalRecords = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as IUser;

        const records = await MedicalRecord.find({ patient: user._id }).populate("doctor", "name email");
        res.json(records);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// Doctor fetches records for a patient
export const getPatientRecords = async (req: AuthRequest, res: Response) => {
    try {
        const doctor = req.user as IUser;
        const { patientId } = req.params;

        const records = await MedicalRecord.find({ patient: patientId, doctor: doctor._id }).populate("patient", "name email");
        res.json(records);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// Delete medical record
export const deleteMedicalRecord = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await MedicalRecord.findByIdAndDelete(id);
        res.json({ msg: "Medical record deleted" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};
