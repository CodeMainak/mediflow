import express from "express";
import { symptomCheck } from "../controllers/aiController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/symptom-check", protect, symptomCheck);

export default router;
