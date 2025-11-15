// src/routes/doctorRoutes.ts
import express from "express";
import { upsertDoctorProfile, getDoctors, searchDoctors } from "../controllers/doctorController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// Doctor creates/updates their profile
router.post("/profile", protect, onlyRole(["Doctor"]), upsertDoctorProfile);

// Get all doctors
router.get("/", protect, getDoctors);

// Search doctors by specialization
router.get("/search", protect, searchDoctors);

export default router;
