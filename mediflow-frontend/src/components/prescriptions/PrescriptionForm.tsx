import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Pill, FileText, User, Calendar, Loader2 } from 'lucide-react';
import { getAppointments } from '../../services/appointmentService';
import { createPrescription, updatePrescription } from '../../services/prescriptionService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
}

interface PrescriptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  prescription?: any; // For edit mode
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSuccess, onCancel, prescription }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    appointment: '',
    patient: '',
    medicines: [{ name: '', dosage: '', duration: '' }] as Medicine[],
    notes: '',
  });

  const isEditMode = !!prescription;

  // Pre-fill form when editing
  useEffect(() => {
    if (prescription) {
      const appointmentId = typeof prescription.appointment === 'object'
        ? prescription.appointment._id
        : prescription.appointment;
      const patientId = typeof prescription.patient === 'object'
        ? prescription.patient._id
        : prescription.patient;

      setFormData({
        appointment: appointmentId || '',
        patient: patientId || '',
        medicines: prescription.medicines || prescription.medications || [{ name: '', dosage: '', duration: '' }],
        notes: prescription.notes || '',
      });
    }
  }, [prescription]);

  // Fetch doctor's appointments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const response = await getAppointments();
        // Only show confirmed/completed appointments
        const validAppointments = (response.data || []).filter(
          (apt: any) => apt.status === 'confirmed' || apt.status === 'completed'
        );
        setAppointments(validAppointments);
      } catch (err) {
        toast.error('Failed to load appointments');
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (user?.role?.toLowerCase() === 'doctor') {
      fetchAppointments();
    }
  }, [user]);

  const handleAppointmentChange = (appointmentId: string) => {
    const selectedApt = appointments.find(apt => apt._id === appointmentId);
    if (selectedApt) {
      setFormData({
        ...formData,
        appointment: appointmentId,
        patient: typeof selectedApt.patientId === 'object'
          ? selectedApt.patientId._id
          : selectedApt.patientId,
      });
    }
  };

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { name: '', dosage: '', duration: '' }],
    });
  };

  const handleRemoveMedicine = (index: number) => {
    const newMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: newMedicines });
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...formData.medicines];
    newMedicines[index][field] = value;
    setFormData({ ...formData, medicines: newMedicines });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMedicines = formData.medicines.filter(
      med => med.name && med.dosage && med.duration
    );

    if (validMedicines.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && prescription) {
        // Update existing prescription
        await updatePrescription(prescription._id || prescription.id, {
          medicines: validMedicines,
          notes: formData.notes,
        });
        toast.success('Prescription updated successfully!');
      } else {
        // Create new prescription
        if (!formData.appointment || !formData.patient) {
          toast.error('Please select an appointment');
          return;
        }

        await createPrescription({
          appointment: formData.appointment,
          patient: formData.patient,
          medicines: validMedicines,
          notes: formData.notes,
        });
        toast.success('Prescription created successfully!');
      }

      // Reset form
      setFormData({
        appointment: '',
        patient: '',
        medicines: [{ name: '', dosage: '', duration: '' }],
        notes: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  const selectedAppointment = appointments.find(apt => apt._id === formData.appointment);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700 mt-4">
              <User className="h-5 w-5 mr-2" />
              Patient & Appointment
            </CardTitle>
            <CardDescription>Select the appointment for this prescription</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="appointment">Appointment *</Label>
            {loadingAppointments ? (
              <div className="flex items-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading appointments...
              </div>
            ) : (
              <Select
                value={formData.appointment}
                onValueChange={handleAppointmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((apt) => {
                    const patient = typeof apt.patientId === 'object' ? apt.patientId : null;
                    const patientName = patient?.name || 'Unknown Patient';
                    const date = new Date(apt.date).toLocaleDateString();

                    return (
                      <SelectItem key={apt._id} value={apt._id}>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {patientName} - {date}
                        </div>
                      </SelectItem>
                    );
                  })}
                  {appointments.length === 0 && (
                    <SelectItem value="none" disabled>
                      No confirmed appointments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedAppointment && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm">
                <strong>Patient:</strong>{' '}
                {typeof selectedAppointment.patientId === 'object'
                  ? selectedAppointment.patientId.name
                  : 'Unknown'}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleString()}
              </p>
              {selectedAppointment.reason && (
                <p className="text-sm">
                  <strong>Reason:</strong> {selectedAppointment.reason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-emerald-700 mt-4">
            <div className="flex items-center">
              <Pill className="h-5 w-5 mr-2" />
              Medicines
            </div>
            <Button
              type="button"
              onClick={handleAddMedicine}
              size="sm"
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medicine
            </Button>
          </CardTitle>
          <CardDescription>Add medicines with dosage and duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.medicines.map((medicine, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Medicine {index + 1}</h4>
                {formData.medicines.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveMedicine(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`medicine-name-${index}`}>Medicine Name *</Label>
                  <Input
                    id={`medicine-name-${index}`}
                    value={medicine.name}
                    onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                    placeholder="e.g., Paracetamol"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`medicine-dosage-${index}`}>Dosage *</Label>
                  <Input
                    id={`medicine-dosage-${index}`}
                    value={medicine.dosage}
                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    placeholder="e.g., 500mg twice daily"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`medicine-duration-${index}`}>Duration *</Label>
                  <Input
                    id={`medicine-duration-${index}`}
                    value={medicine.duration}
                    onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    placeholder="e.g., 7 days"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          {formData.medicines.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No medicines added. Click "Add Medicine" to start.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-emerald-700 mt-4">
            <FileText className="h-5 w-5 mr-2" />
            Additional Notes
          </CardTitle>
          <CardDescription>Any special instructions or notes</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Enter any additional notes, instructions, or precautions..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-gray-300"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {isEditMode ? 'Update Prescription' : 'Create Prescription'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
