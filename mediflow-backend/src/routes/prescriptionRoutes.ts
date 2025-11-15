import express from "express";
import { createPrescription, getPatientPrescriptions, getMyPrescriptions, updatePrescription } from "../controllers/prescriptionController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// Get current user's prescriptions (role-based)
router.get("/my", protect, getMyPrescriptions);

// Doctor creates prescription
router.post("/", protect, onlyRole(["Doctor"]), createPrescription);

// Doctor updates prescription
router.put("/:id", protect, onlyRole(["Doctor"]), updatePrescription);

// Get prescriptions for a specific patient
router.get("/patient/:id", protect, onlyRole(["Doctor", "Patient"]), getPatientPrescriptions);


export default router;
