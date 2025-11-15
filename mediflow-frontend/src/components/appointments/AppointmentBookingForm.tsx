import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2 } from 'lucide-react';
import { bookAppointment } from '../../services/appointmentService';
import { getDoctors } from '../../services/userService';
import { toast } from 'sonner';

interface AppointmentBookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({ onSuccess, onCancel }) => {
  const [dateStr, setDateStr] = useState('');
  const [time, setTime] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [notes, setNotes] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Generate time slots from 9AM to 11PM with 30-minute intervals
  const generateTimeSlots = (): { value: string; label: string }[] => {
    const slots: { value: string; label: string }[] = [];
    const now = new Date();
    const isToday = dateStr === now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let hour = 9; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip past times if today is selected
        if (isToday) {
          if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
            continue;
          }
        }

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        slots.push({ value: timeStr, label: displayTime });
      }
      // Stop after 23:00 (11PM) to avoid going to 23:30
      if (hour === 23) break;
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Clear time selection if it becomes invalid when date changes
  useEffect(() => {
    if (dateStr && time) {
      const isTimeStillValid = timeSlots.some(slot => slot.value === time);
      if (!isTimeStillValid) {
        setTime('');
      }
    }
  }, [dateStr]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const response = await getDoctors();

        // Handle both DoctorProfile array and User array
        const doctorsData = Array.isArray(response.data) ? response.data : [];
        setDoctors(doctorsData);

        if (doctorsData.length === 0) {
        }
      } catch (err: any) {
        toast.error('Failed to load doctors list: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateStr || !time || !doctorId || !notes) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that the appointment is not in the past
    const appointmentDateTime = new Date(dateStr + 'T' + time);
    const now = new Date();

    if (appointmentDateTime <= now) {
      toast.error('Cannot book an appointment in the past. Please select a future date and time.');
      return;
    }

    try {
      setLoading(true);
      // Combine date and time into ISO string format
      const appointmentDate = new Date(dateStr + 'T' + time);

      await bookAppointment({
        doctorId,
        date: appointmentDate.toISOString(),
        time: time,
        notes,
      });

      toast.success('Appointment booked successfully!');

      // Reset form
      setDateStr('');
      setTime('');
      setDoctorId('');
      setNotes('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="doctor">Select Doctor *</Label>
        {loadingDoctors ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
            No doctors available. Please contact admin to add doctors to the system.
          </div>
        ) : (
          <Select value={doctorId} onValueChange={setDoctorId} required>
            <SelectTrigger id="doctor">
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent style={{ zIndex: 99999 }}>
              {doctors.map((doctor: any) => {
                // Handle both DoctorProfile (with user) and direct User objects
                const doctorId = doctor._id || doctor.user?._id;
                const doctorName = doctor.user?.name || doctor.name || 'Unknown Doctor';
                const specialization = doctor.specialization;

                return (
                  <SelectItem key={doctorId} value={doctorId}>
                    {doctorName}
                    {specialization && ` - ${specialization}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Appointment Date & Time *</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={dateStr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateStr(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={(() => {
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 30);
                return maxDate.toISOString().split('T')[0];
              })()}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="text-xs text-muted-foreground">Time</Label>
            <Select value={time} onValueChange={setTime} required>
              <SelectTrigger id="time" className="w-full">
                <SelectValue placeholder="Choose time" />
              </SelectTrigger>
              <SelectContent position="popper" style={{ zIndex: 99999, maxHeight: '300px' }}>
                {timeSlots.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600 text-center">
                    No available time slots for today. Please select a future date.
                  </div>
                ) : (
                  timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Appointments can be booked up to 30 days in advance.
          {dateStr === new Date().toISOString().split('T')[0] && timeSlots.length > 0 && (
            <span className="text-amber-600 block">
              Only future time slots are shown for today's date.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes *</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="e.g., General consultation, Follow-up visit, etc."
          rows={4}
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Book Appointment
        </Button>
      </div>
    </form>
  );
};
