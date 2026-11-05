import { Router } from "express";
import { login, signup, getCurrentUser, updateProfile } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import { authLimiter } from "../middlewares/securityMiddleware";

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);

export default router
