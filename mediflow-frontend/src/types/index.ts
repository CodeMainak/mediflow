export type UserRole = 'doctor' | 'patient' | 'receptionist' | 'admin' | 'pharmacist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  specialization?: string; // for doctors
  department?: string; // for receptionists
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: string[];
  allergies: string[];
  bloodType: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  assignedDoctorId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  notes?: string;
  type: 'consultation' | 'follow-up' | 'emergency';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  followUpDate?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'reminder' | 'alert';
  read: boolean;
  createdAt: string;
}

// ─── Pharmacy Types ───────────────────────────────────────────────────────────

export interface Supplier {
  name: string;
  contactPhone?: string;
  email?: string;
  address?: string;
}

export interface Medicine {
  _id: string;
  name: string;
  brand: string;
  genericName?: string;
  category?: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplier: Supplier;
  unit: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineFormData {
  name: string;
  brand: string;
  genericName?: string;
  category?: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplier: Supplier;
  unit: string;
  description?: string;
}

export interface MedicineStockLog {
  _id: string;
  medicineId: string;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceId?: string;
  referenceType?: 'Sale' | 'PurchaseOrder' | 'Manual';
  performedBy: { _id: string; name: string; role: string };
  createdAt: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  medicines: SaleItem[];
  patientId: { _id: string; name: string; email: string; phone?: string };
  prescriptionId: { _id: string; medicines: Array<{ name: string; dosage: string; duration: string }>; notes?: string };
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMode: 'cash' | 'card' | 'upi';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  soldBy: { _id: string; name: string; role: string };
  notes?: string;
  createdAt: string;
}

export interface SaleFormData {
  prescriptionId: string;
  patientId: string;
  medicines: Array<{ medicineId: string; quantity: number }>;
  paymentMode: 'cash' | 'card' | 'upi';
  discount?: number;
  notes?: string;
}

export interface LowStockAlert extends Medicine {
  deficit: number;
}

export interface ExpiryAlert extends Medicine {
  daysUntilExpiry: number;
  isExpired: boolean;
}

export interface DailySalesStat {
  _id: number; // day of month
  totalRevenue: number;
  salesCount: number;
  totalDiscount?: number;
}

export interface MonthlySalesStat {
  _id: number; // month (1-12)
  totalRevenue: number;
  salesCount: number;
}

export interface PaymentModeStat {
  _id: 'cash' | 'card' | 'upi';
  totalRevenue: number;
  count: number;
}

export interface TopMedicineStat {
  _id: string;
  medicineName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesSummary {
  period: { year: number; month: number };
  monthlyTotal: { totalRevenue: number; salesCount: number };
  daily: DailySalesStat[];
  monthly: MonthlySalesStat[];
  paymentModes: PaymentModeStat[];
  topMedicines: TopMedicineStat[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}