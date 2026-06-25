import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addMedicine, updateMedicine } from '../../services/pharmacyService';
import type { Medicine, MedicineFormData } from '../../types';

interface MedicineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine?: Medicine | null; // null = add mode, Medicine = edit mode
  onSuccess: () => void;
}

const MEDICINE_CATEGORIES = [
  'Antibiotic', 'Analgesic', 'Antifungal', 'Antiviral', 'Antacid',
  'Antihistamine', 'Antihypertensive', 'Antidiabetic', 'Cardiovascular',
  'Dermatological', 'Gastrointestinal', 'Hormonal', 'Neurological',
  'Ophthalmic', 'Respiratory', 'Vitamins & Supplements', 'Other',
];

const MEDICINE_UNITS = ['tablet', 'capsule', 'ml', 'mg', 'g', 'vial', 'sachet', 'patch', 'drops'];

const emptyForm = (): MedicineFormData => ({
  name: '',
  brand: '',
  genericName: '',
  category: '',
  batchNumber: '',
  expiryDate: '',
  unitPrice: 0,
  stockQuantity: 0,
  reorderLevel: 10,
  supplier: { name: '', contactPhone: '', email: '', address: '' },
  unit: 'tablet',
  description: '',
});

export const MedicineFormModal: React.FC<MedicineFormModalProps> = ({
  open,
  onOpenChange,
  medicine,
  onSuccess,
}) => {
  const [form, setForm] = useState<MedicineFormData>(emptyForm());
  const [loading, setLoading] = useState(false);
  const isEdit = !!medicine;

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name,
        brand: medicine.brand,
        genericName: medicine.genericName ?? '',
        category: medicine.category ?? '',
        batchNumber: medicine.batchNumber,
        // format ISO date to YYYY-MM-DD for input[type=date]
        expiryDate: medicine.expiryDate.substring(0, 10),
        unitPrice: medicine.unitPrice,
        stockQuantity: medicine.stockQuantity,
        reorderLevel: medicine.reorderLevel,
        supplier: {
          name: medicine.supplier.name,
          contactPhone: medicine.supplier.contactPhone ?? '',
          email: medicine.supplier.email ?? '',
          address: medicine.supplier.address ?? '',
        },
        unit: medicine.unit,
        description: medicine.description ?? '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [medicine, open]);

  const set = (field: keyof MedicineFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setSupplier = (field: keyof MedicineFormData['supplier'], value: string) => {
    setForm((prev) => ({ ...prev, supplier: { ...prev.supplier, [field]: value } }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Medicine name is required';
    if (!form.brand.trim()) return 'Brand is required';
    if (!form.batchNumber.trim()) return 'Batch number is required';
    if (!form.expiryDate) return 'Expiry date is required';
    if (new Date(form.expiryDate) <= new Date()) return 'Expiry date must be in the future';
    if (form.unitPrice <= 0) return 'Unit price must be greater than 0';
    if (form.reorderLevel < 0) return 'Reorder level cannot be negative';
    if (!form.supplier.name.trim()) return 'Supplier name is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      if (isEdit && medicine) {
        await updateMedicine(medicine._id, form);
        toast.success('Medicine updated successfully');
      } else {
        await addMedicine(form);
        toast.success('Medicine added successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-emerald-700">
            {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Basic Info ──────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-1">Basic Information</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Amoxicillin"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="e.g. Amoxil"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={form.genericName ?? ''}
                  onChange={(e) => set('genericName', e.target.value)}
                  placeholder="e.g. Amoxicillin trihydrate"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.category ?? ''}
                  onChange={(e) => set('category', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select category</option>
                  {MEDICINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Optional notes about the medicine"
              />
            </div>
          </fieldset>

          {/* ── Batch & Pricing ─────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-1">Batch & Pricing</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={form.batchNumber}
                  onChange={(e) => set('batchNumber', e.target.value)}
                  placeholder="e.g. BATCH-2024-001"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => set('expiryDate', e.target.value)}
                  min={new Date().toISOString().substring(0, 10)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.unitPrice}
                  onChange={(e) => set('unitPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {MEDICINE_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* ── Stock ───────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-1">Stock</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="stockQuantity">
                  {isEdit ? 'Current Stock (read-only)' : 'Initial Stock Quantity'}
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => set('stockQuantity', parseInt(e.target.value, 10) || 0)}
                  disabled={isEdit}
                  className={isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                  title={isEdit ? 'Use Stock In/Out to modify stock after creation' : undefined}
                />
                {isEdit && (
                  <p className="text-xs text-amber-600">
                    Use the Stock In / Out buttons to adjust stock
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="reorderLevel">Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min={0}
                  value={form.reorderLevel}
                  onChange={(e) => set('reorderLevel', parseInt(e.target.value, 10) || 0)}
                />
                <p className="text-xs text-gray-500">Alert triggers at or below this quantity</p>
              </div>
            </div>
          </fieldset>

          {/* ── Supplier ─────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-1">Supplier</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                  id="supplierName"
                  value={form.supplier.name}
                  onChange={(e) => setSupplier('name', e.target.value)}
                  placeholder="e.g. MedCorp Ltd."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplierPhone">Contact Phone</Label>
                <Input
                  id="supplierPhone"
                  value={form.supplier.contactPhone ?? ''}
                  onChange={(e) => setSupplier('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplierEmail">Email</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  value={form.supplier.email ?? ''}
                  onChange={(e) => setSupplier('email', e.target.value)}
                  placeholder="supplier@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplierAddress">Address</Label>
                <Input
                  id="supplierAddress"
                  value={form.supplier.address ?? ''}
                  onChange={(e) => setSupplier('address', e.target.value)}
                  placeholder="Supplier address"
                />
              </div>
            </div>
          </fieldset>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Medicine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
