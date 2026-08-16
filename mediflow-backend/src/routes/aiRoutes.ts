import express from "express";
import { symptomChat } from "../controllers/aiController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/symptom-chat", protect, symptomChat);

export default router;
