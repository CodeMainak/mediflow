import React, { useEffect, useState, useCallback } from 'react';
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
import { Badge } from '../ui/badge';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createSale, getMedicines } from '../../services/pharmacyService';
import api from '../../services/api';
import type { Medicine, SaleFormData } from '../../types';

interface Prescription {
  _id: string;
  medicines: Array<{ name: string; dosage: string; duration: string }>;
  notes?: string;
  createdAt: string;
  doctor?: { name: string };
}

interface SaleLineItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
  unit: string;
}

interface SaleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SaleFormModal: React.FC<SaleFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1); // step 1: select patient+rx, step 2: select medicines

  // Step 1
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ _id: string; name: string } | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRx, setLoadingRx] = useState(false);

  // Step 2
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Reset on close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(1);
      setPatientSearch('');
      setPatients([]);
      setSelectedPatient(null);
      setPrescriptions([]);
      setSelectedRx(null);
      setLineItems([]);
      setPaymentMode('cash');
      setDiscount(0);
      setNotes('');
    }
  }, [open]);

  // ── Patient search ─────────────────────────────────────────────────────────
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) { setPatients([]); return; }
    setLoadingPatients(true);
    try {
      const res = await api.get<Array<{ _id: string; name: string; email: string }>>(
        '/api/admin/patients',
        { params: { search: query, limit: 10 } }
      );
      setPatients(res.data);
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientSearch), 350);
    return () => clearTimeout(t);
  }, [patientSearch, searchPatients]);

  // ── Load prescriptions when patient is selected ────────────────────────────
  const loadPrescriptions = async (patientId: string) => {
    setLoadingRx(true);
    try {
      const res = await api.get<Prescription[]>(`/api/prescriptions/patient/${patientId}`);
      setPrescriptions(res.data);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoadingRx(false);
    }
  };

  // ── Load available medicines ───────────────────────────────────────────────
  useEffect(() => {
    if (step === 2) {
      getMedicines({ limit: 200 })
        .then((res) => setAvailableMedicines(res.data.data))
        .catch(() => toast.error('Failed to load medicines'));
    }
  }, [step]);

  // ── Proceed to step 2 ──────────────────────────────────────────────────────
  const handleProceedToStep2 = () => {
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    if (!selectedRx) { toast.error('Please select a prescription'); return; }
    // Pre-populate line items from prescription medicines where possible
    setLineItems([]);
    setStep(2);
  };

  // ── Line item management ───────────────────────────────────────────────────
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { medicineId: '', medicineName: '', quantity: 1, unitPrice: 0, maxStock: 0, unit: 'tablet' },
    ]);
  };

  const updateLineItem = (
    idx: number,
    field: keyof SaleLineItem,
    value: string | number
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      if (field === 'medicineId' && typeof value === 'string') {
        const med = availableMedicines.find((m) => m._id === value);
        if (med) {
          updated[idx] = {
            ...updated[idx],
            medicineId: med._id,
            medicineName: `${med.name} (${med.brand})`,
            unitPrice: med.unitPrice,
            maxStock: med.stockQuantity,
            unit: med.unit,
            quantity: 1,
          };
          return updated;
        }
      }
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmt = (subtotal * discount) / 100;
  const finalAmount = subtotal - discountAmt;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      toast.error('Add at least one medicine to the sale');
      return;
    }

    for (const item of lineItems) {
      if (!item.medicineId) { toast.error('Select a medicine for each line'); return; }
      if (item.quantity < 1) { toast.error('Quantity must be at least 1'); return; }
      if (item.quantity > item.maxStock) {
        toast.error(`Insufficient stock for ${item.medicineName}. Max: ${item.maxStock}`);
        return;
      }
    }

    const payload: SaleFormData = {
      prescriptionId: selectedRx!._id,
      patientId: selectedPatient!._id,
      medicines: lineItems.map(({ medicineId, quantity }) => ({ medicineId, quantity })),
      paymentMode,
      discount,
      notes: notes.trim() || undefined,
    };

    setLoading(true);
    try {
      await createSale(payload);
      toast.success('Sale recorded successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to process sale';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-emerald-700">
            New Sale
            <Badge variant="outline" className="ml-2 text-xs">
              Step {step} of 2
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: Select Patient + Prescription ──────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Search Patient *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Type patient name or email..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              {loadingPatients && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </p>
              )}
              {patients.length > 0 && !selectedPatient && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {patients.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch(p.name);
                        setPatients([]);
                        loadPrescriptions(p._id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-gray-400 ml-2">{p.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                  <span className="text-sm font-medium text-emerald-800">{selectedPatient.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-red-500"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSelectedRx(null);
                      setPrescriptions([]);
                      setPatientSearch('');
                    }}
                  >
                    ✕ Change
                  </Button>
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="space-y-2">
                <Label>Select Prescription *</Label>
                {loadingRx && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading prescriptions...
                  </p>
                )}
                {!loadingRx && prescriptions.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                    No prescriptions found for this patient. A valid prescription is required to process a sale.
                  </p>
                )}
                {prescriptions.map((rx) => (
                  <div
                    key={rx._id}
                    onClick={() => setSelectedRx(rx)}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      selectedRx?._id === rx._id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          Prescription #{rx._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(rx.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                          {rx.doctor && ` · Dr. ${rx.doctor.name}`}
                        </p>
                      </div>
                      {selectedRx?._id === rx._id && (
                        <Badge className="bg-emerald-600 text-white text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rx.medicines.slice(0, 4).map((m, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {m.name}
                        </Badge>
                      ))}
                      {rx.medicines.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{rx.medicines.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!selectedPatient || !selectedRx}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next: Add Medicines →
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP 2: Add Medicines + Payment ────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-3 bg-blue-50 rounded border border-blue-200 text-sm">
              <span className="font-medium">Patient:</span> {selectedPatient?.name} &nbsp;|&nbsp;
              <span className="font-medium">Rx:</span> #{selectedRx?._id.slice(-6).toUpperCase()}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs text-blue-600 ml-2"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>
            </div>

            {/* Prescribed medicines reference */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Prescribed medicines (reference)</Label>
              <div className="flex flex-wrap gap-1">
                {selectedRx?.medicines.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {m.name} · {m.dosage} · {m.duration}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Medicines to Dispense *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Medicine
                </Button>
              </div>

              {lineItems.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed rounded-md">
                  No medicines added yet. Click "Add Medicine" above.
                </p>
              )}

              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Medicine</Label>
                    <select
                      value={item.medicineId}
                      onChange={(e) => updateLineItem(idx, 'medicineId', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">-- Select --</option>
                      {availableMedicines
                        .filter((m) => {
                          const today = new Date();
                          return m.isActive && new Date(m.expiryDate) > today && m.stockQuantity > 0;
                        })
                        .map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.brand}) — {m.stockQuantity} {m.unit}s
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      max={item.maxStock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      value={`₹${item.unitPrice.toFixed(2)}`}
                      readOnly
                      className="h-9 text-xs bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <Input
                      value={`₹${(item.unitPrice * item.quantity).toFixed(2)}`}
                      readOnly
                      className="h-9 text-xs bg-gray-50 font-medium"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeLineItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Payment Mode *</Label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'card' | 'upi')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
              />
            </div>

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="bg-gray-50 rounded border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({discount}%)</span>
                    <span>- ₹{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-700 border-t pt-1 mt-1">
                  <span>Total</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                type="submit"
                disabled={loading || lineItems.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Sale (₹{finalAmount.toFixed(2)})
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
