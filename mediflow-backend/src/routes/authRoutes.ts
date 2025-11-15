import { Router } from "express";
import { login, signup, getCurrentUser, updateProfile } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);

export default router
