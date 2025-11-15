import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Calendar } from '../ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Clock,
  Calendar as CalendarIcon,
  User,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Stethoscope,
  HeartPulse,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService';
import { toast } from 'sonner';
import { AppointmentBookingForm } from './AppointmentBookingForm';
import { AppointmentDetailsDialog } from './AppointmentDetailsDialog';

export const AppointmentManager: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [emptyStateDialogOpen, setEmptyStateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);


  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAppointments();
        setAppointments(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.msg || 'Failed to load appointments');
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const getFilteredAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    if (viewMode === 'day') {
      const selectedDateStr = selectedDate.toLocaleDateString();
      filtered = filtered.filter(apt =>
        new Date(apt.date).toLocaleDateString() === selectedDateStr
      );
    }

    return filtered.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateCompare;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border border-green-300 font-semibold';
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold';
      case 'cancelled': return 'bg-red-100 text-red-700 border border-red-300 font-semibold';
      case 'completed': return 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold';
      default: return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-l-4 border-red-500 bg-red-50 hover:shadow-lg';
      case 'follow-up': return 'border-l-4 border-blue-500 bg-blue-50 hover:shadow-lg';
      case 'consultation': return 'border-l-4 border-green-500 bg-green-50 hover:shadow-lg';
      default: return 'border-l-4 border-gray-300 bg-gray-50 hover:shadow-lg';
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      toast.success(`Appointment ${newStatus === 'approved' ? 'confirmed' : newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update appointment');
    }
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const refreshAppointments = async () => {
    try {
      const response = await getAppointments();
      setAppointments(response.data || []);
    } catch (err: any) {
      toast.error('Failed to refresh appointments');
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <HeartPulse className="mr-3 h-8 w-8 text-red-600 animate-pulse" />
            {user?.role === 'patient' ? 'My Appointments' : 'Appointment Management'}
          </h1>
          <p className="text-md text-gray-600 mt-1">
            {user?.role === 'patient'
              ? '📅 Keep track of your upcoming and past appointments with doctors.'
              : '⚕️ Organize, track, and manage patient appointments effectively.'
            }
          </p>
        </div>

        {(user?.role === 'Patient' || user?.role === 'Receptionist' || user?.role === 'Admin') && (
          <>
            <Button
              onClick={() => {
                setBookingDialogOpen(true);
              }}
              variant="outline"
              className="bg-blue-600 text-gray-300 hover:bg-blue-700 shadow-lg transition-all z-50 relative"
            >
              <Plus className="mr-2 h-5 w-5" />
              Book New Appointment
            </Button>

            <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>🩺 Book a New Appointment</DialogTitle>
                  <DialogDescription>
                    Fill out the form to schedule your appointment
                  </DialogDescription>
                </DialogHeader>
                <AppointmentBookingForm
                  onSuccess={async () => {
                    setBookingDialogOpen(false);
                    // Refresh appointments
                    const response = await getAppointments();
                    setAppointments(response.data || []);
                  }}
                  onCancel={() => setBookingDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-[110px] border-blue-200 text-blue-600 font-medium">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">📆 Day View</SelectItem>
              <SelectItem value="week">📅 Week View</SelectItem>
              <SelectItem value="month">🗓️ Month View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">⏳ Pending</SelectItem>
              <SelectItem value="confirmed">✅ Confirmed</SelectItem>
              <SelectItem value="cancelled">❌ Cancelled</SelectItem>
              <SelectItem value="completed">☑️ Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm font-semibold text-gray-700 p-2 border rounded-lg bg-blue-50">
          <CalendarIcon className="h-4 w-4 inline mr-2 text-blue-500" />
          {filteredAppointments.length} Appointment(s) {viewMode === 'day' ? 'Today' : 'Found'}
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-blue-100">
            <CardHeader className="border-b bg-blue-50">
              <CardTitle className="flex items-center text-blue-800 font-bold mt-4 mb-4">
                <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                Pick a Date
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-none w-full"
                initialFocus
              />
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <Clock className="mr-2 h-6 w-6 text-blue-500 mt-4" />
                {viewMode === 'day'
                  ? `Schedule for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                  : 'Appointments Overview'
                }
              </CardTitle>
              <CardDescription className="text-gray-600">
                Showing {filteredAppointments.length} appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading appointments...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {filteredAppointments.map((appointment) => {
                    // Handle both populated and non-populated data
                    const patient = appointment.patientId;
                    const doctor = appointment.doctorId;
                    const otherParty = user?.role === 'Patient' ? doctor : patient;
                    const isPatient = user?.role === 'Patient';

                    return (
                      <div
                        key={appointment._id}
                        className={`p-4 rounded-xl transition-all duration-200 ${getTypeColor(appointment.type || 'consultation')} shadow-sm`}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">

                          {/* Time + Person */}
                          <div className="flex items-center space-x-4 w-full md:w-3/5 mb-3 md:mb-0">
                            <div className="text-center p-2 bg-white rounded-lg shadow w-20">
                              <div className="font-bold text-lg text-blue-700">
                                {appointment.time ? appointment.time.substring(0, 5) : new Date(appointment.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-gray-500">{appointment.duration || 30} min</div>
                            </div>

                            <Avatar className="h-12 w-12 border-2 border-blue-300">
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                {otherParty?.name ? otherParty.name.split(' ').map((n: string) => n[0]).join('') : '?'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="truncate">
                              <h3 className="font-bold text-gray-900">{otherParty?.name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-600">{appointment.reason || appointment.notes || 'No details'}</p>
                            </div>
                          </div>

                          {/* Status + Actions */}
                          <div className="flex flex-col items-end space-y-2 w-full md:w-2/5">
                            <Badge className={`${getStatusColor(appointment.status)} px-3 py-1 rounded-full`}>
                              {appointment.status.toUpperCase()}
                            </Badge>

                            <div className="flex space-x-2 flex-wrap justify-end">
                              {user?.role === 'Doctor' && appointment.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleStatusUpdate(appointment._id, 'approved')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                    onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {isPatient && appointment.status === 'confirmed' && (
                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                  Reschedule
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                                onClick={() => handleViewDetails(appointment)}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-lg text-gray-600 font-medium">
                        {viewMode === 'day'
                          ? 'No appointments scheduled for this day.'
                          : 'No appointments found with current filters.'
                        }
                      </p>
                      {(user?.role === 'Patient' || user?.role === 'Receptionist' || user?.role === 'Admin') && (
                        <Dialog open={emptyStateDialogOpen} onOpenChange={setEmptyStateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                              <Plus className="mr-2 h-4 w-4" />
                              Book Appointment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Book Appointment</DialogTitle>
                              <DialogDescription>
                                Fill out details to confirm booking.
                              </DialogDescription>
                            </DialogHeader>
                            <AppointmentBookingForm
                              onSuccess={async () => {
                                setEmptyStateDialogOpen(false);
                                // Refresh appointments
                                const response = await getAppointments();
                                setAppointments(response.data || []);
                              }}
                              onCancel={() => setEmptyStateDialogOpen(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedAppointment(null);
          }}
          onUpdate={refreshAppointments}
          userRole={user?.role || 'Patient'}
        />
      )}
    </div>
  );
};
