import express from "express";
import { protect, onlyRole } from "../middlewares/authMiddleware";
import {
    createMedicalRecord,
    getMyMedicalRecords,
    getPatientRecords,
    deleteMedicalRecord
} from "../controllers/medicalRecordController";

const router = express.Router();

// Doctor creates a medical record
router.post("/", protect, onlyRole(["Doctor"]), createMedicalRecord);

// Fetch records
router.get("/me", protect, onlyRole(["Patient"]), getMyMedicalRecords);
router.get("/:patientId", protect, onlyRole(["Doctor"]), getPatientRecords);

// Delete medical record (Doctor only)
router.delete("/:id", protect, onlyRole(["Doctor"]), deleteMedicalRecord);

export default router;
