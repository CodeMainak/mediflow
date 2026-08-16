import express from "express";
import { nearbyPlaces, savePlace, listSavedPlaces, deleteSavedPlace } from "../controllers/placesController";
import { protect } from "../middlewares/authMiddleware";
import { demoLimiter } from "../middlewares/securityMiddleware";

const router = express.Router();

router.get("/nearby", protect, nearbyPlaces);

// Public, unauthenticated version for the /demo page. Same real logic.
router.get("/demo/nearby", demoLimiter, nearbyPlaces);

router.post("/saved", protect, savePlace);
router.get("/saved", protect, listSavedPlaces);
router.delete("/saved/:id", protect, deleteSavedPlace);

export default router;
