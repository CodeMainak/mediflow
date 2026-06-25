import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '../ui/button';
import { Loader2, TrendingUp, IndianRupee, ShoppingCart, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { getSalesSummary } from '../../services/pharmacyService';
import type { SalesSummary } from '../../types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#059669', '#3b82f6', '#a855f7', '#f59e0b'];

const StatCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  Icon: React.ElementType;
  color: string;
}> = ({ title, value, sub, Icon, color }) => (
  <div className={`bg-white border rounded-lg p-4 flex items-center gap-4`}>
    <div className={`${color} p-3 rounded-full shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

export const ReportsPanel: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await getSalesSummary({ year, month });
      setSummary(res.data.data);
    } catch {
      toast.error('Failed to load sales summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [year, month]);

  // ── Chart data transformations ───────────────────────────────────────────
  const dailyData = summary?.daily.map((d) => ({
    day: `${d._id}`,
    Revenue: parseFloat(d.totalRevenue.toFixed(2)),
    Sales: d.salesCount,
  })) ?? [];

  const monthlyData = summary?.monthly.map((m) => ({
    month: MONTH_NAMES[m._id - 1],
    Revenue: parseFloat(m.totalRevenue.toFixed(2)),
    Sales: m.salesCount,
  })) ?? [];

  const paymentData = summary?.paymentModes.map((p) => ({
    name: p._id.toUpperCase(),
    value: parseFloat(p.totalRevenue.toFixed(2)),
    count: p.count,
  })) ?? [];

  const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Sales Analytics</h2>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="h-8 text-sm border rounded px-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="h-8 text-sm border rounded px-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={fetchSummary} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : summary ? (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Revenue This Month"
              value={`₹${summary.monthlyTotal.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              sub={`${MONTH_NAMES[month - 1]} ${year}`}
              Icon={IndianRupee}
              color="bg-emerald-600"
            />
            <StatCard
              title="Total Sales"
              value={`${summary.monthlyTotal.salesCount}`}
              sub="Transactions this month"
              Icon={ShoppingCart}
              color="bg-blue-600"
            />
            <StatCard
              title="Avg. Sale Value"
              value={`₹${summary.monthlyTotal.salesCount > 0
                ? (summary.monthlyTotal.totalRevenue / summary.monthlyTotal.salesCount).toFixed(0)
                : '0'
              }`}
              sub="Per transaction"
              Icon={TrendingUp}
              color="bg-purple-600"
            />
            <StatCard
              title="Top Medicine"
              value={summary.topMedicines[0]?.medicineName?.split(' ')[0] ?? '—'}
              sub={summary.topMedicines[0] ? `${summary.topMedicines[0].totalQuantity} units sold` : 'No data'}
              Icon={Pill}
              color="bg-amber-500"
            />
          </div>

          {/* ── Daily Revenue Chart ─────────────────────────────────────── */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
              Daily Revenue — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {dailyData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sales data for this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="Revenue" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Monthly Trend + Payment Breakdown ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly trend */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Monthly Revenue Trend — {year}</h3>
              {monthlyData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Line type="monotone" dataKey="Revenue" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment mode breakdown */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Payment Mode Breakdown</h3>
              {paymentData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No payment data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {paymentData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Top 10 Medicines ────────────────────────────────────────── */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
              Top Medicines — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {summary.topMedicines.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No medicine sales data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={summary.topMedicines.map((m) => ({
                    name: m.medicineName.length > 25 ? m.medicineName.slice(0, 24) + '…' : m.medicineName,
                    Qty: m.totalQuantity,
                    Revenue: parseFloat(m.totalRevenue.toFixed(2)),
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Qty" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 py-10">No data available.</p>
      )}
    </div>
  );
};
