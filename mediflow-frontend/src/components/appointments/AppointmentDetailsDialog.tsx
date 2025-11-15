import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Stethoscope,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { updateAppointmentStatus } from '../../services/appointmentService';
import { toast } from 'sonner';

interface AppointmentDetailsDialogProps {
  appointment: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  userRole: string;
}

export const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  appointment,
  open,
  onClose,
  onUpdate,
  userRole,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  if (!appointment) return null;

  const patient = appointment.patientId;
  const doctor = appointment.doctorId;
  const isDoctor = userRole === 'Doctor';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await updateAppointmentStatus(appointment._id, newStatus);
      toast.success(`Appointment ${newStatus} successfully`);
      setActionNotes('');
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="mr-2 h-6 w-6 text-blue-600" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Status</h3>
            <Badge className={`${getStatusColor(appointment.status)} px-4 py-1.5 text-sm font-semibold`}>
              {appointment.status.toUpperCase()}
            </Badge>
          </div>

          {/* Patient Information */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <User className="mr-2 h-4 w-4" />
              Patient Information
            </h3>
            <div className="flex items-center space-x-3 mt-2">
              <Avatar className="h-12 w-12 border-2 border-blue-300">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {patient?.name ? patient.name.split(' ').map((n: string) => n[0]).join('') : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{patient?.name || 'Unknown Patient'}</p>
                <p className="text-sm text-gray-600">{patient?.email || 'No email'}</p>
                <p className="text-sm text-gray-600">{patient?.phone || 'No phone'}</p>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          {!isDoctor && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 flex items-center">
                <Stethoscope className="mr-2 h-4 w-4" />
                Doctor Information
              </h3>
              <div className="flex items-center space-x-3 mt-2">
                <Avatar className="h-12 w-12 border-2 border-green-300">
                  <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                    {doctor?.name ? doctor.name.split(' ').map((n: string) => n[0]).join('') : 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">Dr. {doctor?.name || 'Unknown Doctor'}</p>
                  <p className="text-sm text-gray-600">{doctor?.specialization || 'General Practice'}</p>
                  <p className="text-sm text-gray-600">{doctor?.email || 'No email'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                Date
              </Label>
              <p className="font-semibold text-gray-900">
                {new Date(appointment.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                Time
              </Label>
              <p className="font-semibold text-gray-900">
                {appointment.time || new Date(appointment.date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' '}({appointment.duration || 30} min)
              </p>
            </div>
          </div>

          {/* Appointment Type */}
          {appointment.type && (
            <div className="space-y-2">
              <Label className="text-gray-700">Type</Label>
              <p className="font-semibold text-gray-900 capitalize">{appointment.type}</p>
            </div>
          )}

          {/* Reason/Notes */}
          <div className="space-y-2">
            <Label className="text-gray-700">
              {appointment.reason ? 'Reason for Visit' : 'Notes'}
            </Label>
            <p className="text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
              {appointment.reason || appointment.notes || 'No details provided'}
            </p>
          </div>

          {/* Action Notes (for doctors) */}
          {isDoctor && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Label htmlFor="action-notes" className="text-amber-900 font-semibold flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Add Notes (Optional)
              </Label>
              <Textarea
                id="action-notes"
                value={actionNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNotes(e.target.value)}
                placeholder="Add any notes about this appointment..."
                rows={3}
                className="bg-white"
              />
            </div>
          )}
        </div>

        {/* Action Buttons for Doctors */}
        {isDoctor && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {appointment.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve Appointment
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={loading}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}

            {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Completed
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}

            {(appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'rejected') && (
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close
              </Button>
            )}
          </DialogFooter>
        )}

        {/* Close button for non-doctors */}
        {!isDoctor && (
          <DialogFooter>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
