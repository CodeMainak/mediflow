import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AlertTriangle, Clock, RefreshCw, PackageX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getLowStockAlerts, getExpiryAlerts } from '../../services/pharmacyService';
import type { LowStockAlert, ExpiryAlert } from '../../types';

export const AlertsPanel: React.FC = () => {
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([]);
  const [expiring, setExpiring] = useState<ExpiryAlert[]>([]);
  const [loadingLow, setLoadingLow] = useState(true);
  const [loadingExp, setLoadingExp] = useState(true);
  const [withinDays, setWithinDays] = useState(90);

  const fetchLowStock = async () => {
    setLoadingLow(true);
    try {
      const res = await getLowStockAlerts();
      setLowStock(res.data.data);
    } catch {
      toast.error('Failed to load low-stock alerts');
    } finally {
      setLoadingLow(false);
    }
  };

  const fetchExpiry = async () => {
    setLoadingExp(true);
    try {
      const res = await getExpiryAlerts(withinDays);
      setExpiring(res.data.data);
    } catch {
      toast.error('Failed to load expiry alerts');
    } finally {
      setLoadingExp(false);
    }
  };

  useEffect(() => { fetchLowStock(); }, []);
  useEffect(() => { fetchExpiry(); }, [withinDays]);

  const refresh = () => { fetchLowStock(); fetchExpiry(); };

  const expiredItems = expiring.filter((m) => m.isExpired);
  const soonItems = expiring.filter((m) => !m.isExpired);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pharmacy Alerts</h2>
          <p className="text-sm text-gray-500">
            {lowStock.length} low-stock · {expiredItems.length} expired · {soonItems.length} expiring soon
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Alert summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <PackageX className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{loadingLow ? '—' : lowStock.length}</p>
            <p className="text-sm text-red-600">Low / Out of Stock</p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700">{loadingExp ? '—' : expiredItems.length}</p>
            <p className="text-sm text-orange-600">Expired Medicines</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{loadingExp ? '—' : soonItems.length}</p>
            <p className="text-sm text-amber-600">Expiring Soon</p>
          </div>
        </div>
      </div>

      {/* ── Low Stock Table ─────────────────────────────────────────────── */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <PackageX className="h-4 w-4 text-red-500" />
          Low Stock Medicines
        </h3>
        <div className="border rounded-lg overflow-hidden">
          {loadingLow ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <PackageX className="h-8 w-8 mx-auto mb-2 opacity-50" />
              All medicines are adequately stocked.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-red-700">Medicine</th>
                  <th className="text-left px-4 py-3 font-semibold text-red-700">Brand</th>
                  <th className="text-right px-4 py-3 font-semibold text-red-700">Stock</th>
                  <th className="text-right px-4 py-3 font-semibold text-red-700">Reorder Level</th>
                  <th className="text-right px-4 py-3 font-semibold text-red-700">Deficit</th>
                  <th className="text-left px-4 py-3 font-semibold text-red-700">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-red-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStock.map((m) => (
                  <tr key={m._id} className={`${m.stockQuantity === 0 ? 'bg-red-50' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-600">{m.brand}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={m.stockQuantity === 0 ? 'text-red-700 font-bold' : 'text-amber-700 font-semibold'}>
                        {m.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{m.reorderLevel}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 font-semibold">+{m.deficit}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.supplier.name}</td>
                    <td className="px-4 py-3">
                      {m.stockQuantity === 0
                        ? <Badge className="bg-red-600 text-white text-xs">Out of Stock</Badge>
                        : <Badge className="bg-amber-500 text-white text-xs">Low Stock</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Expiry Table ────────────────────────────────────────────────── */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Expiry Alerts
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show expiring within</span>
            <Input
              type="number"
              min={1}
              max={365}
              value={withinDays}
              onChange={(e) => setWithinDays(parseInt(e.target.value, 10) || 90)}
              className="w-20 h-7 text-xs"
            />
            <span className="text-xs text-gray-500">days</span>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {loadingExp ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : expiring.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No medicines expiring within {withinDays} days.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-orange-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Medicine</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Batch</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Expiry Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Days Left</th>
                  <th className="text-right px-4 py-3 font-semibold text-orange-700">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-orange-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expiring.map((m) => (
                  <tr key={m._id} className={`${m.isExpired ? 'bg-red-50' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.brand}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.batchNumber}</td>
                    <td className="px-4 py-3">
                      {new Date(m.expiryDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.isExpired ? 'text-red-700 font-bold' : m.daysUntilExpiry <= 30 ? 'text-red-600 font-semibold' : 'text-amber-700 font-semibold'}>
                        {m.isExpired ? 'EXPIRED' : `${m.daysUntilExpiry}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{m.stockQuantity}</td>
                    <td className="px-4 py-3">
                      {m.isExpired
                        ? <Badge className="bg-red-600 text-white text-xs">Expired</Badge>
                        : m.daysUntilExpiry <= 30
                        ? <Badge className="bg-red-500 text-white text-xs">Critical</Badge>
                        : <Badge className="bg-amber-500 text-white text-xs">Warning</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
