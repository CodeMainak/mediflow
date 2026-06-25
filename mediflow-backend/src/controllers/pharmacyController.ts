import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Medicine, IMedicine } from "../models/Medicine";
import { MedicineStockLog } from "../models/MedicineStockLog";
import { Sale, ISaleItem } from "../models/Sale";
import { Prescription } from "../models/Prescription";
import { IUser } from "../models/User";

// ─── Helpers ────────────────────────────────────────────────────────────────

const isExpired = (expiryDate: Date): boolean => {
    return new Date(expiryDate) < new Date();
};

const daysUntilExpiry = (expiryDate: Date): number => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Medicine CRUD ───────────────────────────────────────────────────────────

/**
 * POST /api/pharmacy/medicines
 * Roles: Admin, Pharmacist
 */
export const addMedicine = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            name,
            brand,
            genericName,
            category,
            batchNumber,
            expiryDate,
            unitPrice,
            stockQuantity,
            reorderLevel,
            supplier,
            unit,
            description,
        } = req.body;

        const existing = await Medicine.findOne({ name, brand, batchNumber });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A medicine with this name, brand, and batch number already exists.",
            });
        }

        const medicine = await Medicine.create({
            name,
            brand,
            genericName,
            category,
            batchNumber,
            expiryDate: new Date(expiryDate),
            unitPrice,
            stockQuantity: stockQuantity ?? 0,
            reorderLevel: reorderLevel ?? 10,
            supplier,
            unit: unit ?? "tablet",
            description,
        });

        // If initial stock > 0, write an audit log
        if (stockQuantity && stockQuantity > 0) {
            await MedicineStockLog.create({
                medicineId: medicine._id,
                changeType: "IN",
                quantity: stockQuantity,
                quantityBefore: 0,
                quantityAfter: stockQuantity,
                reason: "Initial stock entry",
                referenceType: "Manual",
                performedBy: (req.user as IUser)._id,
            });
        }

        return res.status(201).json({ success: true, data: medicine });
    } catch (err: unknown) {
        if (err instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Error adding medicine", error: err });
    }
};

/**
 * GET /api/pharmacy/medicines
 * Roles: Admin, Pharmacist, Doctor (read-only)
 * Query: search, category, page, limit
 */
export const getMedicines = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            search,
            category,
            includeInactive,
            page = "1",
            limit = "50",
        } = req.query as Record<string, string>;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));

        const filter: mongoose.FilterQuery<IMedicine> = {};

        if (includeInactive !== "true") {
            filter.isActive = true;
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const [medicines, total] = await Promise.all([
            Medicine.find(filter)
                .sort({ name: 1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Medicine.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: medicines,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching medicines", error: err });
    }
};

/**
 * GET /api/pharmacy/medicines/:id
 * Roles: Admin, Pharmacist, Doctor
 */
export const getMedicineById = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const medicine = await Medicine.findById(req.params["id"]);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }
        return res.json({ success: true, data: medicine });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching medicine", error: err });
    }
};

/**
 * PUT /api/pharmacy/medicines/:id
 * Roles: Admin, Pharmacist
 */
export const updateMedicine = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const id = req.params["id"];
        const medicine = await Medicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }

        // Prevent direct stockQuantity mutation through this endpoint — use stock endpoints
        const { stockQuantity: _ignored, ...updateFields } = req.body;

        if (updateFields.expiryDate) {
            updateFields.expiryDate = new Date(updateFields.expiryDate);
        }

        const updated = await Medicine.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return res.json({ success: true, data: updated });
    } catch (err: unknown) {
        if (err instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Error updating medicine", error: err });
    }
};

/**
 * DELETE /api/pharmacy/medicines/:id
 * Roles: Admin only — soft delete
 */
export const deleteMedicine = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const medicine = await Medicine.findById(req.params["id"]);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }

        // Soft delete — preserve history
        medicine.isActive = false;
        await medicine.save();

        return res.json({ success: true, message: "Medicine deactivated successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error deleting medicine", error: err });
    }
};

// ─── Stock Management ────────────────────────────────────────────────────────

/**
 * POST /api/pharmacy/stock/in
 * Roles: Admin, Pharmacist
 * Body: { medicineId, quantity, reason, batchNumber?, expiryDate? }
 */
export const stockIn = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { medicineId, quantity, reason, batchNumber, expiryDate } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be positive" });
        }

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }
        if (!medicine.isActive) {
            return res.status(400).json({ success: false, message: "Cannot stock an inactive medicine" });
        }

        const quantityBefore = medicine.stockQuantity;

        // Update batch/expiry if provided (new delivery may have new batch)
        if (batchNumber) medicine.batchNumber = batchNumber;
        if (expiryDate) medicine.expiryDate = new Date(expiryDate);
        medicine.stockQuantity += quantity;
        await medicine.save();

        await MedicineStockLog.create({
            medicineId,
            changeType: "IN",
            quantity,
            quantityBefore,
            quantityAfter: medicine.stockQuantity,
            reason: reason || "Stock replenishment",
            referenceType: "Manual",
            performedBy: (req.user as IUser)._id,
        });

        return res.json({
            success: true,
            message: `Added ${quantity} units to ${medicine.name}`,
            data: { stockQuantity: medicine.stockQuantity },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating stock", error: err });
    }
};

/**
 * POST /api/pharmacy/stock/out
 * Roles: Admin, Pharmacist
 * Body: { medicineId, quantity, reason }
 * Note: prefer POST /api/pharmacy/sales for sale-linked deductions.
 *       This endpoint is for adjustments (damaged goods, audit, wastage).
 */
export const stockOut = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { medicineId, quantity, reason } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be positive" });
        }

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found" });
        }
        if (!medicine.isActive) {
            return res.status(400).json({ success: false, message: "Medicine is inactive" });
        }
        if (medicine.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${medicine.stockQuantity}, Requested: ${quantity}`,
            });
        }

        const quantityBefore = medicine.stockQuantity;
        medicine.stockQuantity -= quantity;
        await medicine.save();

        await MedicineStockLog.create({
            medicineId,
            changeType: "ADJUSTMENT",
            quantity,
            quantityBefore,
            quantityAfter: medicine.stockQuantity,
            reason: reason || "Manual stock adjustment",
            referenceType: "Manual",
            performedBy: (req.user as IUser)._id,
        });

        return res.json({
            success: true,
            message: `Deducted ${quantity} units from ${medicine.name}`,
            data: { stockQuantity: medicine.stockQuantity },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error adjusting stock", error: err });
    }
};

/**
 * GET /api/pharmacy/stock/logs/:medicineId
 * Roles: Admin, Pharmacist
 */
export const getStockLogs = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { medicineId } = req.params;
        const { page = "1", limit = "30" } = req.query as Record<string, string>;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, parseInt(limit, 10));

        const [logs, total] = await Promise.all([
            MedicineStockLog.find({ medicineId })
                .populate("performedBy", "name role")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            MedicineStockLog.countDocuments({ medicineId }),
        ]);

        return res.json({
            success: true,
            data: logs,
            pagination: { total, page: pageNum, limit: limitNum },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching stock logs", error: err });
    }
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

/**
 * GET /api/pharmacy/alerts/low-stock
 * Returns medicines where stockQuantity <= reorderLevel
 */
export const getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const medicines = await Medicine.find({
            isActive: true,
            $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
        })
            .sort({ stockQuantity: 1 })
            .lean();

        return res.json({
            success: true,
            count: medicines.length,
            data: medicines.map((m) => ({
                ...m,
                deficit: m.reorderLevel - m.stockQuantity,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching low stock alerts", error: err });
    }
};

/**
 * GET /api/pharmacy/alerts/expiry
 * Query: withinDays (default 90) — returns medicines expiring within N days (includes already expired)
 */
export const getExpiryAlerts = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const withinDays = parseInt((req.query["withinDays"] as string) ?? "90", 10);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + withinDays);

        const medicines = await Medicine.find({
            isActive: true,
            expiryDate: { $lte: thresholdDate },
        })
            .sort({ expiryDate: 1 })
            .lean();

        return res.json({
            success: true,
            count: medicines.length,
            data: medicines.map((m) => ({
                ...m,
                daysUntilExpiry: daysUntilExpiry(m.expiryDate),
                isExpired: isExpired(m.expiryDate),
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching expiry alerts", error: err });
    }
};

// ─── Sales ───────────────────────────────────────────────────────────────────

/**
 * POST /api/pharmacy/sales
 * Roles: Pharmacist, Admin
 *
 * Body: {
 *   prescriptionId: string,
 *   patientId: string,
 *   medicines: [{ medicineId, quantity }],
 *   paymentMode: "cash" | "card" | "upi",
 *   discount?: number,
 *   notes?: string
 * }
 *
 * Business rules enforced:
 *  1. Prescription must exist and belong to patientId
 *  2. No expired medicines
 *  3. No sale beyond available stock
 *  4. Atomic stock deduction + audit log via MongoDB session
 */
export const createSale = async (req: AuthRequest, res: Response): Promise<Response> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            prescriptionId,
            patientId,
            medicines: saleItems,
            paymentMode,
            discount = 0,
            notes,
        } = req.body;

        // ── 1. Validate prescription ─────────────────────────────────────────
        const prescription = await Prescription.findById(prescriptionId).session(session);
        if (!prescription) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Prescription not found" });
        }

        // Ensure prescription belongs to the stated patient
        const prescriptionPatientId =
            (prescription.patient as mongoose.Types.ObjectId).toString();
        if (prescriptionPatientId !== patientId.toString()) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Prescription does not belong to the specified patient",
            });
        }

        // ── 2. Validate each medicine ────────────────────────────────────────
        const resolvedItems: ISaleItem[] = [];
        let totalAmount = 0;

        for (const item of saleItems as { medicineId: string; quantity: number }[]) {
            if (!item.medicineId || !item.quantity || item.quantity <= 0) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: "Invalid medicine entry" });
            }

            const medicine = await Medicine.findById(item.medicineId).session(session);

            if (!medicine) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Medicine not found: ${item.medicineId}`,
                });
            }
            if (!medicine.isActive) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Medicine is inactive: ${medicine.name}`,
                });
            }
            if (isExpired(medicine.expiryDate)) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Cannot sell expired medicine: ${medicine.name} (expired ${medicine.expiryDate.toDateString()})`,
                });
            }
            if (medicine.stockQuantity < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}, Requested: ${item.quantity}`,
                });
            }

            const subtotal = medicine.unitPrice * item.quantity;
            totalAmount += subtotal;

            resolvedItems.push({
                medicineId: medicine._id as mongoose.Types.ObjectId,
                medicineName: `${medicine.name} (${medicine.brand})`,
                quantity: item.quantity,
                unitPrice: medicine.unitPrice,
                subtotal,
            });
        }

        // ── 3. Calculate amounts ─────────────────────────────────────────────
        const discountPct = Math.max(0, Math.min(100, discount));
        const finalAmount = parseFloat(
            (totalAmount - (totalAmount * discountPct) / 100).toFixed(2)
        );

        // ── 4. Create sale record ────────────────────────────────────────────
        const [sale] = await Sale.create(
            [
                {
                    medicines: resolvedItems,
                    patientId,
                    prescriptionId,
                    totalAmount,
                    discount: discountPct,
                    finalAmount,
                    paymentMode,
                    paymentStatus: "paid",
                    soldBy: (req.user as IUser)._id,
                    notes,
                },
            ],
            { session }
        );

        // ── 5. Atomically deduct stock and write audit logs ──────────────────
        for (const item of resolvedItems) {
            const medicine = await Medicine.findById(item.medicineId).session(session);
            if (!medicine) continue; // already validated above, this is a safeguard

            const quantityBefore = medicine.stockQuantity;
            medicine.stockQuantity -= item.quantity;
            await medicine.save({ session });

            await MedicineStockLog.create(
                [
                    {
                        medicineId: item.medicineId,
                        changeType: "OUT",
                        quantity: item.quantity,
                        quantityBefore,
                        quantityAfter: medicine.stockQuantity,
                        reason: `Sale #${(sale._id as mongoose.Types.ObjectId).toString().slice(-6)} — Prescription #${(sale.prescriptionId as mongoose.Types.ObjectId).toString().slice(-6)}`,
                        referenceId: sale._id,
                        referenceType: "Sale",
                        performedBy: (req.user as IUser)._id,
                    },
                ],
                { session }
            );
        }

        await session.commitTransaction();

        const populatedSale = await Sale.findById(sale._id)
            .populate("patientId", "name email phone")
            .populate("prescriptionId", "medicines notes")
            .populate("soldBy", "name role");

        return res.status(201).json({ success: true, data: populatedSale });
    } catch (err: unknown) {
        await session.abortTransaction();
        if (err instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Error processing sale", error: err });
    } finally {
        session.endSession();
    }
};

/**
 * GET /api/pharmacy/sales
 * Roles: Admin, Pharmacist, Receptionist
 * Query: from, to (ISO date strings), patientId, page, limit
 */
export const getSales = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            from,
            to,
            patientId,
            page = "1",
            limit = "20",
        } = req.query as Record<string, string>;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, parseInt(limit, 10));

        const filter: mongoose.FilterQuery<typeof Sale> = {};

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }

        if (patientId) {
            filter.patientId = patientId;
        }

        const [sales, total] = await Promise.all([
            Sale.find(filter)
                .populate("patientId", "name email phone")
                .populate("prescriptionId", "medicines notes createdAt")
                .populate("soldBy", "name role")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Sale.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: sales,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching sales", error: err });
    }
};

/**
 * GET /api/pharmacy/sales/summary
 * Roles: Admin, Pharmacist
 * Returns daily and monthly revenue aggregations
 */
export const getSalesSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { year, month } = req.query as Record<string, string>;

        const now = new Date();
        const targetYear = year ? parseInt(year, 10) : now.getFullYear();
        const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1; // 1-based

        // ── Daily breakdown for the specified month ───────────────────────────
        const dailyPipeline: mongoose.PipelineStage[] = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, targetMonth - 1, 1),
                        $lt: new Date(targetYear, targetMonth, 1),
                    },
                    paymentStatus: "paid",
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$createdAt" },
                    totalRevenue: { $sum: "$finalAmount" },
                    salesCount: { $sum: 1 },
                    totalDiscount: { $sum: { $subtract: ["$totalAmount", "$finalAmount"] } },
                },
            },
            { $sort: { _id: 1 } },
        ];

        // ── Monthly breakdown for the specified year ──────────────────────────
        const monthlyPipeline: mongoose.PipelineStage[] = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, 0, 1),
                        $lt: new Date(targetYear + 1, 0, 1),
                    },
                    paymentStatus: "paid",
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: "$finalAmount" },
                    salesCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ];

        // ── Payment mode breakdown ────────────────────────────────────────────
        const paymentModePipeline: mongoose.PipelineStage[] = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, targetMonth - 1, 1),
                        $lt: new Date(targetYear, targetMonth, 1),
                    },
                    paymentStatus: "paid",
                },
            },
            {
                $group: {
                    _id: "$paymentMode",
                    totalRevenue: { $sum: "$finalAmount" },
                    count: { $sum: 1 },
                },
            },
        ];

        // ── Top selling medicines (current month) ─────────────────────────────
        const topMedicinesPipeline: mongoose.PipelineStage[] = [
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, targetMonth - 1, 1),
                        $lt: new Date(targetYear, targetMonth, 1),
                    },
                    paymentStatus: "paid",
                },
            },
            { $unwind: "$medicines" },
            {
                $group: {
                    _id: "$medicines.medicineId",
                    medicineName: { $first: "$medicines.medicineName" },
                    totalQuantity: { $sum: "$medicines.quantity" },
                    totalRevenue: { $sum: "$medicines.subtotal" },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
        ];

        const [daily, monthly, paymentModes, topMedicines] = await Promise.all([
            Sale.aggregate(dailyPipeline),
            Sale.aggregate(monthlyPipeline),
            Sale.aggregate(paymentModePipeline),
            Sale.aggregate(topMedicinesPipeline),
        ]);

        // Overall totals for this month
        const monthlyTotal = daily.reduce(
            (acc, d) => ({
                totalRevenue: acc.totalRevenue + d.totalRevenue,
                salesCount: acc.salesCount + d.salesCount,
            }),
            { totalRevenue: 0, salesCount: 0 }
        );

        return res.json({
            success: true,
            data: {
                period: { year: targetYear, month: targetMonth },
                monthlyTotal,
                daily,
                monthly,
                paymentModes,
                topMedicines,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching sales summary", error: err });
    }
};

/**
 * GET /api/pharmacy/sales/:id
 * Roles: Admin, Pharmacist, Receptionist
 */
export const getSaleById = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const sale = await Sale.findById(req.params["id"])
            .populate("patientId", "name email phone")
            .populate("prescriptionId", "medicines notes createdAt doctor")
            .populate("soldBy", "name role");

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found" });
        }

        return res.json({ success: true, data: sale });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error fetching sale", error: err });
    }
};
