import express from "express";
import { nearbyPlaces } from "../controllers/placesController";
import { protect } from "../middlewares/authMiddleware";
import { demoLimiter } from "../middlewares/securityMiddleware";

const router = express.Router();

router.get("/nearby", protect, nearbyPlaces);

// Public, unauthenticated version for the /demo page. Same real logic.
router.get("/demo/nearby", demoLimiter, nearbyPlaces);

export default router;
