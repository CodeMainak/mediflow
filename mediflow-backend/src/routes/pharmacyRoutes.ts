import express from "express";
import {
    // Medicine CRUD
    addMedicine,
    getMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    // Stock
    stockIn,
    stockOut,
    getStockLogs,
    // Alerts
    getLowStockAlerts,
    getExpiryAlerts,
    // Sales
    createSale,
    getSales,
    getSaleById,
    getSalesSummary,
} from "../controllers/pharmacyController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// ─── All pharmacy routes require authentication ───────────────────────────────
router.use(protect);

// ─── Medicine routes ──────────────────────────────────────────────────────────

// POST   /api/pharmacy/medicines       — Admin, Pharmacist
router.post(
    "/medicines",
    onlyRole(["Admin", "Pharmacist"]),
    addMedicine
);

// GET    /api/pharmacy/medicines       — Admin, Pharmacist, Doctor (read-only)
router.get(
    "/medicines",
    onlyRole(["Admin", "Pharmacist", "Doctor"]),
    getMedicines
);

// GET    /api/pharmacy/medicines/:id   — Admin, Pharmacist, Doctor
router.get(
    "/medicines/:id",
    onlyRole(["Admin", "Pharmacist", "Doctor"]),
    getMedicineById
);

// PUT    /api/pharmacy/medicines/:id   — Admin, Pharmacist
router.put(
    "/medicines/:id",
    onlyRole(["Admin", "Pharmacist"]),
    updateMedicine
);

// DELETE /api/pharmacy/medicines/:id   — Admin only (soft delete)
router.delete(
    "/medicines/:id",
    onlyRole(["Admin"]),
    deleteMedicine
);

// ─── Stock routes ─────────────────────────────────────────────────────────────

// POST   /api/pharmacy/stock/in        — Admin, Pharmacist
router.post(
    "/stock/in",
    onlyRole(["Admin", "Pharmacist"]),
    stockIn
);

// POST   /api/pharmacy/stock/out       — Admin, Pharmacist (manual adjustments/wastage)
router.post(
    "/stock/out",
    onlyRole(["Admin", "Pharmacist"]),
    stockOut
);

// GET    /api/pharmacy/stock/logs/:medicineId — Admin, Pharmacist
router.get(
    "/stock/logs/:medicineId",
    onlyRole(["Admin", "Pharmacist"]),
    getStockLogs
);

// ─── Alert routes ─────────────────────────────────────────────────────────────

// GET    /api/pharmacy/alerts/low-stock
router.get(
    "/alerts/low-stock",
    onlyRole(["Admin", "Pharmacist", "Doctor"]),
    getLowStockAlerts
);

// GET    /api/pharmacy/alerts/expiry
router.get(
    "/alerts/expiry",
    onlyRole(["Admin", "Pharmacist", "Doctor"]),
    getExpiryAlerts
);

// ─── Sales routes ─────────────────────────────────────────────────────────────

// IMPORTANT: /sales/summary must be registered BEFORE /sales/:id
// to prevent Express matching "summary" as a dynamic :id parameter

// GET    /api/pharmacy/sales/summary   — Admin, Pharmacist
router.get(
    "/sales/summary",
    onlyRole(["Admin", "Pharmacist"]),
    getSalesSummary
);

// POST   /api/pharmacy/sales           — Admin, Pharmacist
router.post(
    "/sales",
    onlyRole(["Admin", "Pharmacist"]),
    createSale
);

// GET    /api/pharmacy/sales           — Admin, Pharmacist, Receptionist
router.get(
    "/sales",
    onlyRole(["Admin", "Pharmacist", "Receptionist"]),
    getSales
);

// GET    /api/pharmacy/sales/:id       — Admin, Pharmacist, Receptionist
router.get(
    "/sales/:id",
    onlyRole(["Admin", "Pharmacist", "Receptionist"]),
    getSaleById
);

export default router;
