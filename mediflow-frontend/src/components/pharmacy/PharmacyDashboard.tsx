import React, { useState } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { InventoryManager } from './InventoryManager';
import { SalesManager } from './SalesManager';
import { AlertsPanel } from './AlertsPanel';
import { ReportsPanel } from './ReportsPanel';
import { useAuth } from '../../context/AuthContext';

type PharmacyTab = 'overview' | 'inventory' | 'sales' | 'alerts' | 'reports';

const tabConfig: { id: PharmacyTab; label: string; path: string; Icon: React.ElementType; roles: string[] }[] = [
  { id: 'overview',   label: 'Overview',  path: '',            Icon: LayoutDashboard, roles: ['admin', 'pharmacist', 'Admin', 'Pharmacist'] },
  { id: 'inventory',  label: 'Inventory', path: 'inventory',   Icon: Package,         roles: ['admin', 'pharmacist', 'doctor', 'Admin', 'Pharmacist', 'Doctor'] },
  { id: 'sales',      label: 'Sales',     path: 'sales',       Icon: ShoppingCart,    roles: ['admin', 'pharmacist', 'receptionist', 'Admin', 'Pharmacist', 'Receptionist'] },
  { id: 'alerts',     label: 'Alerts',    path: 'alerts',      Icon: AlertTriangle,   roles: ['admin', 'pharmacist', 'doctor', 'Admin', 'Pharmacist', 'Doctor'] },
  { id: 'reports',    label: 'Reports',   path: 'reports',     Icon: BarChart3,       roles: ['admin', 'pharmacist', 'Admin', 'Pharmacist'] },
];

/**
 * PharmacyOverview — landing tile for /pharmacy
 */
const PharmacyOverview: React.FC<{ onNav: (tab: PharmacyTab) => void }> = ({ onNav }) => {
  const { user } = useAuth();

  const cards = [
    {
      id: 'inventory' as PharmacyTab,
      label: 'Medicine Inventory',
      desc: 'Browse and manage medicines, stock levels, and supplier info.',
      Icon: Package,
      color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'sales' as PharmacyTab,
      label: 'Sales',
      desc: 'Process new sales linked to prescriptions, view transaction history.',
      Icon: ShoppingCart,
      color: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'alerts' as PharmacyTab,
      label: 'Alerts',
      desc: 'View low-stock and expiry alerts requiring immediate attention.',
      Icon: AlertTriangle,
      color: 'border-amber-300 bg-amber-50 hover:bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'reports' as PharmacyTab,
      label: 'Reports & Analytics',
      desc: 'Daily/monthly revenue charts, top medicines, payment mode breakdown.',
      Icon: BarChart3,
      color: 'border-purple-300 bg-purple-50 hover:bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const allowedCards = cards.filter((c) =>
    tabConfig.find((t) => t.id === c.id)?.roles.includes(user?.role ?? '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pharmacy Module</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage medicine inventory, process prescription-linked sales, and track analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allowedCards.map(({ id, label, desc, Icon, color, iconColor }) => (
          <button
            key={id}
            onClick={() => onNav(id)}
            className={`text-left p-6 rounded-xl border-2 transition-all ${color} cursor-pointer`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-7 w-7 ${iconColor}`} />
              <h3 className="font-semibold text-gray-900">{label}</h3>
            </div>
            <p className="text-sm text-gray-600">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * PharmacyDashboard — tab-based shell for all pharmacy pages.
 * Rendered inside DashboardLayout via App.tsx route nesting.
 */
export const PharmacyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from current path
  const pathSegment = location.pathname.split('/pharmacy')[1]?.replace(/^\//, '') ?? '';

  const getActiveTab = (): PharmacyTab => {
    if (pathSegment === 'inventory') return 'inventory';
    if (pathSegment === 'sales') return 'sales';
    if (pathSegment === 'alerts') return 'alerts';
    if (pathSegment === 'reports') return 'reports';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const handleNav = (tab: PharmacyTab) => {
    const config = tabConfig.find((t) => t.id === tab);
    const path = config?.path ? `/pharmacy/${config.path}` : '/pharmacy';
    navigate(path);
  };

  // Filter tabs the current user can see
  const visibleTabs = tabConfig.filter((t) => t.roles.includes(user?.role ?? ''));

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {visibleTabs.map(({ id, label, Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'secondary' : 'ghost'}
            size="sm"
            className={
              activeTab === id
                ? 'bg-emerald-100 text-emerald-800 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }
            onClick={() => handleNav(id)}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Routed content */}
      <div>
        <Routes>
          <Route path="/" element={<PharmacyOverview onNav={handleNav} />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/sales" element={<SalesManager />} />
          <Route path="/alerts" element={<AlertsPanel />} />
          <Route path="/reports" element={<ReportsPanel />} />
          <Route path="*" element={<Navigate to="/pharmacy" replace />} />
        </Routes>
      </div>
    </div>
  );
};
