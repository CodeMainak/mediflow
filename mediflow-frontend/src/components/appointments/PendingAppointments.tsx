import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react';
import { updateAppointmentStatus } from '../../services/appointmentService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface PendingAppointmentsProps {
  appointments: any[];
  onStatusUpdate: () => void;
  loading?: boolean;
}

export const PendingAppointments: React.FC<PendingAppointmentsProps> = ({
  appointments,
  onStatusUpdate,
  loading,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    return timeStr;
  };

  const handleAction = (appointment: any, action: 'approve' | 'reject') => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedAppointment || !actionType) return;

    try {
      setProcessingId(selectedAppointment._id);
      const newStatus = actionType === 'approve' ? 'confirmed' : 'cancelled';

      await updateAppointmentStatus(selectedAppointment._id, newStatus);

      toast.success(
        `Appointment ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`
      );

      setDialogOpen(false);
      setSelectedAppointment(null);
      setActionType(null);
      onStatusUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update appointment status');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-amber-200 shadow-xl bg-white">
        <CardHeader className="bg-amber-50 border-b border-amber-100 p-4">
          <CardTitle className="flex items-center text-xl font-bold text-amber-800">
            <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
            Pending Appointment Requests
          </CardTitle>
          <CardDescription className="text-sm text-amber-700">
            Review and approve/reject appointment requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 shadow-xl bg-white">
        <CardHeader className="bg-amber-50 border-b border-amber-100 p-4">
          <CardTitle className="flex items-center text-xl font-bold text-amber-800">
            <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
            Pending Appointment Requests
            {pendingAppointments.length > 0 && (
              <Badge className="ml-3 bg-amber-500 text-white">
                {pendingAppointments.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-sm text-amber-700">
            Review and approve/reject appointment requests from your patients
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50/50 pb-4">
              <CheckCircle className="mx-auto h-12 w-12 text-amber-500 mb-4 mt-4" />
              <p className="text-amber-800 font-medium text-lg">All caught up!</p>
              <p className="text-sm text-amber-600 mt-2">No pending appointment requests</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {pendingAppointments.map((appointment) => {
                const patient = appointment.patientId;
                const isProcessing = processingId === appointment._id;

                return (
                  <div
                    key={appointment._id}
                    className="border border-amber-200 rounded-lg p-4 bg-white hover:bg-amber-50 transition-colors shadow-sm"
                  >
                    {/* Patient Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-amber-400">
                          <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-base">
                            {patient?.name
                              ? patient.name.split(' ').map((n: string) => n[0]).join('')
                              : 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 text-lg flex items-center">
                            {patient?.name || 'Unknown Patient'}
                            <Badge
                              variant="outline"
                              className="ml-2 border-amber-300 bg-amber-50 text-amber-700 text-xs"
                            >
                              Pending
                            </Badge>
                          </p>
                          {patient?.email && (
                            <p className="text-xs text-gray-600 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {patient.email}
                            </p>
                          )}
                          {patient?.phone && (
                            <p className="text-xs text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {patient.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                        <span className="font-medium">Date:</span>
                        <span className="ml-2">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="h-4 w-4 mr-2 text-amber-600" />
                        <span className="font-medium">Time:</span>
                        <span className="ml-2">
                          {appointment.time
                            ? formatTime(appointment.time)
                            : new Date(appointment.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </span>
                      </div>
                      {(appointment.reason || appointment.notes) && (
                        <div className="flex items-start text-sm text-gray-700">
                          <User className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                          <span className="font-medium">Reason:</span>
                          <span className="ml-2 flex-1">
                            {appointment.reason || appointment.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAction(appointment, 'approve')}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white mr-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleAction(appointment, 'reject')}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {actionType === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve Appointment' : 'Reject Appointment'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this appointment request?'
                : 'Are you sure you want to reject this appointment request?'}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <p className="font-semibold text-gray-900 mb-2">
                {selectedAppointment.patientId?.name || 'Unknown Patient'}
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedAppointment.date)} at{' '}
                {selectedAppointment.time
                  ? formatTime(selectedAppointment.time)
                  : new Date(selectedAppointment.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
              </p>
              {(selectedAppointment.reason || selectedAppointment.notes) && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Reason:</span>{' '}
                  {selectedAppointment.reason || selectedAppointment.notes}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedAppointment(null);
                setActionType(null);
              }}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                  : 'bg-red-600 hover:bg-red-700 text-white font-medium'
              }
              disabled={processingId !== null}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
              ) : null}
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
