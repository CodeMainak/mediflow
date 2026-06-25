import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getMedicines,
  deleteMedicine,
  stockIn,
  stockOut,
  getStockLogs,
} from '../../services/pharmacyService';
import { MedicineFormModal } from './MedicineFormModal';
import type { Medicine, MedicineStockLog } from '../../types';
import { useAuth } from '../../context/AuthContext';

const EXPIRY_WARN_DAYS = 90;

const getExpiryBadge = (expiryDate: string) => {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge className="bg-red-600 text-white text-xs">Expired</Badge>;
  if (days <= 30) return <Badge className="bg-red-500 text-white text-xs">{days}d left</Badge>;
  if (days <= EXPIRY_WARN_DAYS) return <Badge className="bg-amber-500 text-white text-xs">{days}d left</Badge>;
  return <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>;
};

const getStockBadge = (qty: number, reorder: number) => {
  if (qty === 0) return <Badge className="bg-red-600 text-white text-xs">Out of Stock</Badge>;
  if (qty <= reorder) return <Badge className="bg-amber-500 text-white text-xs">Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-800 text-xs">{qty}</Badge>;
};

export const InventoryManager: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role?.toLowerCase() === 'pharmacist' || user?.role === 'Pharmacist';
  const canDelete = user?.role === 'Admin';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Add/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  // Stock adjust modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockMode, setStockMode] = useState<'IN' | 'OUT'>('IN');
  const [stockTarget, setStockTarget] = useState<Medicine | null>(null);
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  // Logs modal
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsMedicine, setLogsMedicine] = useState<Medicine | null>(null);
  const [logs, setLogs] = useState<MedicineStockLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMedicines({ search: debouncedSearch || undefined, page: currentPage, limit: 20 });
      setMedicines(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const handleDelete = async (medicine: Medicine) => {
    if (!confirm(`Deactivate "${medicine.name}"? It will be hidden from inventory.`)) return;
    try {
      await deleteMedicine(medicine._id);
      toast.success('Medicine deactivated');
      fetchMedicines();
    } catch {
      toast.error('Failed to deactivate medicine');
    }
  };

  const openStockModal = (medicine: Medicine, mode: 'IN' | 'OUT') => {
    setStockTarget(medicine);
    setStockMode(mode);
    setStockQty(1);
    setStockReason('');
    setStockModalOpen(true);
  };

  const handleStockAdjust = async () => {
    if (!stockTarget) return;
    if (stockQty <= 0) { toast.error('Quantity must be positive'); return; }
    if (!stockReason.trim()) { toast.error('Reason is required'); return; }

    setStockLoading(true);
    try {
      if (stockMode === 'IN') {
        await stockIn({ medicineId: stockTarget._id, quantity: stockQty, reason: stockReason });
      } else {
        await stockOut({ medicineId: stockTarget._id, quantity: stockQty, reason: stockReason });
      }
      toast.success(`Stock ${stockMode === 'IN' ? 'added' : 'deducted'} successfully`);
      setStockModalOpen(false);
      fetchMedicines();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to adjust stock';
      toast.error(msg);
    } finally {
      setStockLoading(false);
    }
  };

  const openLogs = async (medicine: Medicine) => {
    setLogsMedicine(medicine);
    setLogsOpen(true);
    setLogsLoading(true);
    try {
      const res = await getStockLogs(medicine._id);
      setLogs(res.data.data);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        {canEdit && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
            onClick={() => { setSelectedMedicine(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Medicine
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <p className="text-sm text-gray-500">
        {loading ? 'Loading...' : `Showing ${medicines.length} of ${pagination.total} medicines`}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Medicine</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Batch</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Expiry</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Supplier</th>
                {canEdit && <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading inventory...
                  </td>
                </tr>
              )}
              {!loading && medicines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No medicines found.
                  </td>
                </tr>
              )}
              {!loading && medicines.map((med) => {
                const days = Math.ceil((new Date(med.expiryDate).getTime() - Date.now()) / 86400000);
                const isLowStock = med.stockQuantity <= med.reorderLevel;
                const isExpiringSoon = days >= 0 && days <= EXPIRY_WARN_DAYS;
                const rowHighlight = (isLowStock || isExpiringSoon) ? 'bg-amber-50' : '';

                return (
                  <tr key={med._id} className={`hover:bg-gray-50 transition-colors ${rowHighlight}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.brand}{med.genericName ? ` · ${med.genericName}` : ''}</p>
                        {med.category && <Badge variant="outline" className="text-xs mt-1">{med.category}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">{med.batchNumber}</td>
                    <td className="px-4 py-3">
                      {getExpiryBadge(med.expiryDate)}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(med.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">₹{med.unitPrice.toFixed(2)}/{med.unit}</td>
                    <td className="px-4 py-3">
                      {getStockBadge(med.stockQuantity, med.reorderLevel)}
                      <p className="text-xs text-gray-400 mt-0.5">Reorder @ {med.reorderLevel}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{med.supplier.name}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="Stock In"
                            onClick={() => openStockModal(med, 'IN')}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                            title="Stock Out / Adjust"
                            onClick={() => openStockModal(med, 'OUT')}
                          >
                            <TrendingDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="View Audit Log"
                            onClick={() => openLogs(med)}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-600 hover:text-gray-900"
                            title="Edit"
                            onClick={() => { setSelectedMedicine(med); setFormOpen(true); }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Deactivate"
                              onClick={() => handleDelete(med)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ← Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pagination.pages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Add/Edit Medicine Modal */}
      <MedicineFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        medicine={selectedMedicine}
        onSuccess={fetchMedicines}
      />

      {/* Stock Adjust Modal */}
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={stockMode === 'IN' ? 'text-green-700' : 'text-orange-700'}>
              {stockMode === 'IN' ? '+ Stock In' : '− Stock Adjustment / Wastage'}
            </DialogTitle>
          </DialogHeader>
          {stockTarget && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">{stockTarget.name} — {stockTarget.brand}</p>
                <p className="text-gray-500">Current stock: {stockTarget.stockQuantity} {stockTarget.unit}s</p>
              </div>
              <div className="space-y-1">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  max={stockMode === 'OUT' ? stockTarget.stockQuantity : undefined}
                  value={stockQty}
                  onChange={(e) => setStockQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label>Reason *</Label>
                <Input
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder={stockMode === 'IN' ? 'e.g. New delivery from supplier' : 'e.g. Damaged batch, Expired goods'}
                />
              </div>
              {stockMode === 'IN' && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                  New stock: {stockTarget.stockQuantity + stockQty} {stockTarget.unit}s
                </div>
              )}
              {stockMode === 'OUT' && (
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  Remaining stock: {Math.max(0, stockTarget.stockQuantity - stockQty)} {stockTarget.unit}s
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleStockAdjust}
              disabled={stockLoading}
              className={stockMode === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}
            >
              {stockLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {stockMode === 'IN' ? 'Stock In' : 'Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Logs Modal */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log — {logsMedicine?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No audit logs found.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Before</th>
                    <th className="px-3 py-2 text-right">After</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={
                          log.changeType === 'IN'
                            ? 'bg-green-100 text-green-700 text-xs'
                            : log.changeType === 'OUT'
                            ? 'bg-red-100 text-red-700 text-xs'
                            : 'bg-gray-100 text-gray-700 text-xs'
                        }>
                          {log.changeType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{log.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-500">{log.quantityBefore}</td>
                      <td className="px-3 py-2 text-right font-mono font-medium">{log.quantityAfter}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{log.reason}</td>
                      <td className="px-3 py-2 text-gray-600">{log.performedBy?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
