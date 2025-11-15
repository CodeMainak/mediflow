import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader2, CheckCircle, Calendar, Clock, User, Stethoscope, FileText } from 'lucide-react';
import { getAppointments } from '../../services/appointmentService';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

interface CheckInPatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CheckInPatientForm: React.FC<CheckInPatientFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Fetch today's confirmed appointments
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const response = await getAppointments();
        const allAppointments = response.data || [];

        // Filter for today's confirmed appointments only
        const todayDate = new Date().toISOString().split('T')[0];
        const todayConfirmedAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.date).toISOString().split('T')[0];
          return aptDate === todayDate && apt.status === 'confirmed';
        });

        setAppointments(todayConfirmedAppointments);
      } catch (err: any) {
        toast.error('Failed to load appointments');
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchTodayAppointments();
  }, []);

  // Update selected appointment details when selection changes
  useEffect(() => {
    if (selectedAppointmentId) {
      const appointment = appointments.find(
        (apt: any) => (apt._id || apt.id) === selectedAppointmentId
      );
      setSelectedAppointment(appointment || null);
    } else {
      setSelectedAppointment(null);
    }
  }, [selectedAppointmentId, appointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppointmentId) {
      toast.error('Please select an appointment');
      return;
    }

    setLoading(true);

    try {
      const checkInTime = new Date().toISOString();

      const response = await fetch(
        `http://localhost:8000/api/appointments/${selectedAppointmentId}/checkin`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ checkInTime }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to check in patient');
      }

      toast.success('Patient checked in successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to check in patient');
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (appointment: any) => {
    if (typeof appointment.patientId === 'object' && appointment.patientId?.name) {
      return appointment.patientId.name;
    }
    return 'Unknown Patient';
  };

  const getDoctorName = (appointment: any) => {
    if (typeof appointment.doctorId === 'object' && appointment.doctorId?.name) {
      return appointment.doctorId.name;
    }
    return 'Unknown Doctor';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Appointment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
            Select Today's Appointment
          </CardTitle>
          <CardDescription>Choose a confirmed appointment to check in the patient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-md text-sm text-amber-800">
              No confirmed appointments for today. Patients must have a confirmed appointment to check in.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="appointment">Appointment *</Label>
              <Select value={selectedAppointmentId} onValueChange={setSelectedAppointmentId} required>
                <SelectTrigger id="appointment">
                  <SelectValue placeholder="Choose an appointment" />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 99999 }}>
                  {appointments.map((appointment: any) => {
                    const appointmentId = appointment._id || appointment.id;
                    const patientName = getPatientName(appointment);
                    const doctorName = getDoctorName(appointment);
                    const time = appointment.time || 'N/A';

                    return (
                      <SelectItem key={appointmentId} value={appointmentId}>
                        {time} - {patientName} with {doctorName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Appointment Details */}
      {selectedAppointment && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-600" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-emerald-100">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {getPatientName(selectedAppointment)
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="font-semibold text-gray-900">
                      {getPatientName(selectedAppointment)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Stethoscope className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      Dr. {getDoctorName(selectedAppointment)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <Label className="text-xs text-gray-600">Appointment Time</Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {selectedAppointment.time || 'N/A'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <Label className="text-xs text-gray-600">Status</Label>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              {/* Reason/Notes */}
              {(selectedAppointment.reason || selectedAppointment.notes) && (
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <Label className="text-xs text-gray-600">Reason for Visit</Label>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedAppointment.reason || selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedAppointmentId}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In Patient
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
