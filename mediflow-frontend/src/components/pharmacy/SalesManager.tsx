import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Plus, Search, Eye, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { getSales, getSaleById } from '../../services/pharmacyService';
import { SaleFormModal } from './SaleFormModal';
import type { Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';

const paymentBadge = (mode: string) => {
  const map: Record<string, string> = {
    cash: 'bg-green-100 text-green-700',
    card: 'bg-blue-100 text-blue-700',
    upi: 'bg-purple-100 text-purple-700',
  };
  return (
    <Badge className={`${map[mode] ?? 'bg-gray-100 text-gray-700'} text-xs capitalize`}>
      {mode}
    </Badge>
  );
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    refunded: 'bg-red-100 text-red-700',
  };
  return (
    <Badge className={`${map[status] ?? 'bg-gray-100 text-gray-700'} text-xs capitalize`}>
      {status}
    </Badge>
  );
};

export const SalesManager: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'Admin' || user?.role?.toLowerCase() === 'pharmacist' || user?.role === 'Pharmacist';

  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales({
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        limit: 15,
      });
      setSales(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, currentPage]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const openDetail = async (saleId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await getSaleById(saleId);
      setSelectedSale(res.data.data);
    } catch {
      toast.error('Failed to load sale details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilter = () => { setCurrentPage(1); fetchSales(); };
  const clearFilter = () => { setFromDate(''); setToDate(''); setCurrentPage(1); };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-end">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 text-sm w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 text-sm w-36"
            />
          </div>
          <Button variant="outline" size="sm" onClick={applyFilter}>
            <Search className="h-3.5 w-3.5 mr-1" /> Filter
          </Button>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="text-gray-500">
              Clear
            </Button>
          )}
        </div>
        {canCreate && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => setNewSaleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Sale
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {loading ? 'Loading...' : `${pagination.total} sales found`}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Sale ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Patient</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Items</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Sold By</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading sales...
                  </td>
                </tr>
              )}
              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No sales found for the selected period.
                  </td>
                </tr>
              )}
              {!loading && sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    #{sale._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    <br />
                    <span className="text-gray-400">
                      {new Date(sale.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{sale.patientId?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{sale.patientId?.phone ?? sale.patientId?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="space-y-0.5">
                      {sale.medicines.slice(0, 2).map((m, i) => (
                        <div key={i} className="text-gray-600">
                          {m.medicineName} × {m.quantity}
                        </div>
                      ))}
                      {sale.medicines.length > 2 && (
                        <div className="text-gray-400">+{sale.medicines.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-emerald-700">
                      ₹{sale.finalAmount.toFixed(2)}
                    </span>
                    {sale.discount > 0 && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{sale.totalAmount.toFixed(2)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{paymentBadge(sale.paymentMode)}</td>
                  <td className="px-4 py-3">{statusBadge(sale.paymentStatus)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {sale.soldBy?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-600 hover:text-blue-800"
                      onClick={() => openDetail(sale._id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            ← Previous
          </Button>
          <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= pagination.pages} onClick={() => setCurrentPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      {/* New Sale Modal */}
      <SaleFormModal
        open={newSaleOpen}
        onOpenChange={setNewSaleOpen}
        onSuccess={fetchSales}
      />

      {/* Sale Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : selectedSale ? (
            <div className="space-y-4 text-sm">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-xs text-gray-500">Sale ID</p>
                  <p className="font-mono font-medium">#{selectedSale._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date & Time</p>
                  <p>{new Date(selectedSale.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium">{selectedSale.patientId?.name}</p>
                  <p className="text-xs text-gray-400">{selectedSale.patientId?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prescription Ref</p>
                  <p className="font-mono text-xs">#{selectedSale.prescriptionId?._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sold By</p>
                  <p>{selectedSale.soldBy?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <div className="flex gap-1">
                    {paymentBadge(selectedSale.paymentMode)}
                    {statusBadge(selectedSale.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* Line items */}
              <table className="w-full text-xs border rounded overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2">Medicine</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Unit Price</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedSale.medicines.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{item.medicineName}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{selectedSale.totalAmount.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({selectedSale.discount}%)</span>
                    <span>- ₹{(selectedSale.totalAmount - selectedSale.finalAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-700 text-base border-t pt-1">
                  <span>Total</span>
                  <span>₹{selectedSale.finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <p className="text-xs text-gray-500 italic">Note: {selectedSale.notes}</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
