import express from "express";
import { nearbyPlaces } from "../controllers/placesController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/nearby", protect, nearbyPlaces);

export default router;
