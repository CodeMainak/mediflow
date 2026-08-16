import express from "express";
import { symptomChat } from "../controllers/aiController";
import { protect } from "../middlewares/authMiddleware";
import { demoLimiter } from "../middlewares/securityMiddleware";

const router = express.Router();

router.post("/symptom-chat", protect, symptomChat);

// Public, unauthenticated version for the /demo page — same real logic,
// no fake data, just no login required. Separately rate-limited since it's
// open to the internet and calls a paid API when OPENAI_API_KEY is set.
router.post("/demo/symptom-chat", demoLimiter, symptomChat);

export default router;
