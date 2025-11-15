import express from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getSystemStats,
    getActivityLog,
} from "../controllers/adminController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User management - Admin and Receptionist can manage users
router.get("/users", onlyRole(["Admin", "Receptionist"]), getAllUsers);
router.get("/users/:userId", onlyRole(["Admin", "Receptionist"]), getUserById);
router.post("/users", onlyRole(["Admin", "Receptionist"]), createUser);
router.patch("/users/:userId", onlyRole(["Admin", "Receptionist"]), updateUser);
router.delete("/users/:userId", onlyRole(["Admin"]), deleteUser); // Only Admin can delete

// System statistics and monitoring - Admin only
router.get("/stats", onlyRole(["Admin"]), getSystemStats);
router.get("/activity", onlyRole(["Admin"]), getActivityLog);

export default router;
