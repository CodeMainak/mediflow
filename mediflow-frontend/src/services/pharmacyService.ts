import api from './api';
import type {
  Medicine,
  MedicineFormData,
  MedicineStockLog,
  Sale,
  SaleFormData,
  SalesSummary,
  LowStockAlert,
  ExpiryAlert,
  PaginatedResponse,
} from '../types';

// ─── Medicine ─────────────────────────────────────────────────────────────────

export const addMedicine = (data: MedicineFormData) =>
  api.post<{ success: boolean; data: Medicine }>('/api/pharmacy/medicines', data);

export const getMedicines = (params?: {
  search?: string;
  category?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}) => api.get<PaginatedResponse<Medicine>>('/api/pharmacy/medicines', { params });

export const getMedicineById = (id: string) =>
  api.get<{ success: boolean; data: Medicine }>(`/api/pharmacy/medicines/${id}`);

export const updateMedicine = (id: string, data: Partial<MedicineFormData>) =>
  api.put<{ success: boolean; data: Medicine }>(`/api/pharmacy/medicines/${id}`, data);

export const deleteMedicine = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/api/pharmacy/medicines/${id}`);

// ─── Stock ────────────────────────────────────────────────────────────────────

export const stockIn = (data: {
  medicineId: string;
  quantity: number;
  reason: string;
  batchNumber?: string;
  expiryDate?: string;
}) => api.post<{ success: boolean; message: string; data: { stockQuantity: number } }>(
  '/api/pharmacy/stock/in',
  data
);

export const stockOut = (data: {
  medicineId: string;
  quantity: number;
  reason: string;
}) => api.post<{ success: boolean; message: string; data: { stockQuantity: number } }>(
  '/api/pharmacy/stock/out',
  data
);

export const getStockLogs = (
  medicineId: string,
  params?: { page?: number; limit?: number }
) =>
  api.get<{ success: boolean; data: MedicineStockLog[]; pagination: PaginatedResponse<MedicineStockLog>['pagination'] }>(
    `/api/pharmacy/stock/logs/${medicineId}`,
    { params }
  );

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const getLowStockAlerts = () =>
  api.get<{ success: boolean; count: number; data: LowStockAlert[] }>(
    '/api/pharmacy/alerts/low-stock'
  );

export const getExpiryAlerts = (withinDays = 90) =>
  api.get<{ success: boolean; count: number; data: ExpiryAlert[] }>(
    '/api/pharmacy/alerts/expiry',
    { params: { withinDays } }
  );

// ─── Sales ────────────────────────────────────────────────────────────────────

export const createSale = (data: SaleFormData) =>
  api.post<{ success: boolean; data: Sale }>('/api/pharmacy/sales', data);

export const getSales = (params?: {
  from?: string;
  to?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}) => api.get<PaginatedResponse<Sale>>('/api/pharmacy/sales', { params });

export const getSaleById = (id: string) =>
  api.get<{ success: boolean; data: Sale }>(`/api/pharmacy/sales/${id}`);

export const getSalesSummary = (params?: { year?: number; month?: number }) =>
  api.get<{ success: boolean; data: SalesSummary }>(
    '/api/pharmacy/sales/summary',
    { params }
  );
