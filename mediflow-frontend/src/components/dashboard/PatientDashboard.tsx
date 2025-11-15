import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Calendar,
  FileText,
  Clock,
  User,
  Heart,
  Pill,
  Activity,
  Shield,
  Stethoscope,
  Thermometer,
  CalendarCheck,
  ClipboardList,
  AlertCircle,
  Phone,
  Droplet,
  CalendarDays,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { mockAppointments, mockUsers, mockPrescriptions } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { AppointmentBookingForm } from '../appointments/AppointmentBookingForm';
import { getAppointments, deleteAppointment } from '../../services/appointmentService';
import { getRecentActivities } from '../../services/activityService';
import { getMyPrescriptions } from '../../services/prescriptionService';
import { RecentActivityLog } from './RecentActivityLog';
import { toast } from 'sonner';

// Define Practo-like primary color variables for reuse
const PractoPrimary = 'emerald-600';
const PractoSecondary = 'teal-500';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);

  // Fetch real appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await getAppointments();
        const appointmentsData = Array.isArray(response.data) ? response.data : [];
        setAppointments(appointmentsData);
      } catch (err: any) {
        toast.error('Failed to load appointments');
        // Fallback to mock data if API fails
        setAppointments(mockAppointments.filter(apt => apt.patientId === user?.id));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const recentActivities = await getRecentActivities(user?.id);
        setActivities(recentActivities);
      } catch (err: any) {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    if (user) {
      fetchActivities();
    }
  }, [user]); // Removed appointments dependency to prevent unnecessary refetches

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setPrescriptionsLoading(true);
        const response = await getMyPrescriptions();
        const prescriptionsData = Array.isArray(response.data) ? response.data : [];
        setPrescriptions(prescriptionsData);
      } catch (err: any) {
        // Fallback to mock data if API fails
        setPrescriptions(mockPrescriptions.filter(presc => presc.patientId === user?.id));
      } finally {
        setPrescriptionsLoading(false);
      }
    };

    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  // Use real API data if available, otherwise fallback to mock data
  const patientAppointments = appointments.length > 0 ? appointments : mockAppointments.filter(apt => apt.patientId === user?.id);
  const patientPrescriptions = prescriptions.length > 0 ? prescriptions : mockPrescriptions.filter(presc => presc.patientId === user?.id);

  const upcomingAppointments = patientAppointments.filter(apt => {
    const appointmentDate = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    return appointmentDate >= today;
  }).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );


  const nextAppointment = upcomingAppointments[0];

  // Re-added definition for activePrescriptions (as fixed previously)
  const activePrescriptions = patientPrescriptions.filter(presc => {
    const prescDate = new Date(presc.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - prescDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30; // Active if prescribed within last 30 days
  });

  // Handler to refresh appointments after booking
  const handleBookingSuccess = async () => {
    setBookingDialogOpen(false);
    try {
      const response = await getAppointments();
      setAppointments(response.data || []);

      // Refresh activities
      const recentActivities = await getRecentActivities(user?.id);
      setActivities(recentActivities);

      toast.success('Appointment booked successfully!');
    } catch (err) {
    }
  };

  // Open manage dialog
  const handleManageAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setManageDialogOpen(true);
  };

  // Cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setCancelLoading(true);
      await deleteAppointment(selectedAppointment._id || selectedAppointment.id);

      toast.success('Appointment cancelled successfully!');

      // Refresh appointments
      const response = await getAppointments();
      setAppointments(response.data || []);

      // Refresh activities
      const recentActivities = await getRecentActivities(user?.id);
      setActivities(recentActivities);

      setManageDialogOpen(false);
      setSelectedAppointment(null);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 text-white font-medium border-green-600'; // Stronger color for Confirmed
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatTime = (timeStr: string) => {
    // Handle HH:mm format
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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen bg-gray-50">

      {/* 1. Welcome Banner (The first direct child) */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg" style={{ margin: "40px 0" }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">
              Hello, {user?.name}
            </h1>
            <p className="text-lg text-emerald-100 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-emerald-300" />
              Your personalized health dashboard is ready.
            </p>
          </div>

          <Button
            onClick={() => setBookingDialogOpen(true)}
            className="bg-white hover:bg-gray-100 text-emerald-700 font-semibold text-base px-6 py-3 shadow-lg hidden sm:flex"
          >
            <CalendarDays className="h-5 w-5 mr-2" />
            Book New Appointment
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards (Personalized Header Colors) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" style={{ margin: "40px 0" }}>
        <Card className="relative overflow-hidden border-l-4 border-emerald-600 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
          {/* Watermark background icon */}
          <div className="absolute right-2 bottom-2 opacity-10 text-emerald-400">
            <CalendarCheck className="h-28 w-28" />
          </div>

          {/* Header with darker banner */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-emerald-600">
            <CardTitle className="text-sm font-semibold text-black">
              Next Appointment
            </CardTitle>
            {/* <Calendar className="h-5 w-5 text-white" /> */}
          </CardHeader>

          {/* Content */}
          <CardContent className="relative z-10 p-4 pt-2">
            {nextAppointment ? (
              <>
                <div className="text-2xl font-extrabold text-gray-900">
                  {formatTime(nextAppointment.time)}
                </div>
                <p className="text-sm text-emerald-700 flex items-center mt-1">
                  <CalendarCheck className="h-4 w-4 mr-1" />
                  {formatDate(nextAppointment.date)}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-extrabold text-gray-900">No Booking</div>
                <p className="text-sm text-gray-600">
                  <span className="text-emerald-700 font-medium">Book Now</span> for quick service.
                </p>
              </>
            )}
          </CardContent>
        </Card>


        {/* Total Consults - Secondary (Teal) */}
        <Card className="relative overflow-hidden border-l-4 border-teal-500 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
          {/* Watermark background icon */}
          <div className="absolute right-2 bottom-2 opacity-10 text-teal-400">
            <Stethoscope className="h-28 w-28" />
          </div>

          {/* Header with darker teal banner */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-teal-600">
            <CardTitle className="text-sm font-semibold text-black">
              Total Consults
            </CardTitle>
          </CardHeader>

          {/* Content */}
          <CardContent className="relative z-10 p-4 pt-2">
            <div className="text-2xl font-extrabold text-gray-900">
              {patientAppointments.length}
            </div>
            <p className="text-sm text-teal-700 flex items-center mt-1">
              <Activity className="h-4 w-4 mr-1" />
              <span className="font-medium">{upcomingAppointments.length}{" "}</span>upcoming
            </p>
          </CardContent>
        </Card>


        {/* Active Prescriptions - Warning (Amber) */}
        <Card className="relative overflow-hidden border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
          {/* Watermark background icon */}
          <div className="absolute right-2 bottom-2 opacity-10 text-amber-400">
            <Pill className="h-28 w-28" />
          </div>

          {/* Header with darker amber banner */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-amber-600">
            <CardTitle className="text-sm font-semibold text-black">
              Active Prescriptions
            </CardTitle>
          </CardHeader>

          {/* Content */}
          <CardContent className="relative z-10 p-4 pt-2">
            <div className="text-2xl font-extrabold text-gray-900">
              {activePrescriptions.length}
            </div>
            <p className="text-sm text-amber-700 flex items-center mt-1">
              <FileText className="h-4 w-4 mr-1" />
              Need Refill?
            </p>
          </CardContent>
        </Card>


        {/* Health Vitals - Info (Blue) */}
        <Card className="relative overflow-hidden border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
          {/* Watermark background icon */}
          <div className="absolute right-2 bottom-2 opacity-10 text-blue-400">
            <Heart className="h-28 w-28" />
          </div>

          {/* Header with darker blue banner */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-blue-600">
            <CardTitle className="text-sm font-semibold text-blue-400">
              Health Vitals
            </CardTitle>
          </CardHeader>

          {/* Content */}
          <CardContent className="relative z-10 p-4 pt-2">
            <div className="text-2xl font-extrabold text-gray-900 flex items-center">
              <Thermometer className="h-6 w-6 mr-2 text-blue-500" />
              Stable
            </div>
            <p className="text-sm text-blue-700 flex items-center mt-1">
              <UserCheck className="h-4 w-4 mr-1" />
              Last updated today
            </p>
          </CardContent>
        </Card>

      </div>

      {/* 3. Main Content Area: Focused Lists (No changes needed, already uses themed headers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ margin: "40px 0" }}>

        {/* Upcoming Appointments List (Emerald Theme) */}
        <Card className="border-emerald-200 shadow-xl bg-white">
          <CardHeader className="bg-emerald-50 border-b border-emerald-100 p-4">
            <CardTitle className="flex items-center text-xl font-bold text-emerald-800">
              <Calendar className={`h-6 w-6 text-${PractoPrimary} mr-3`} />
              Upcoming Consultations
            </CardTitle>
            <CardDescription className="text-sm text-emerald-700">
              Your next steps for continuity of care.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-emerald-300 rounded-lg bg-emerald-50/50 py-4">
                  <Calendar className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                  <p className="text-emerald-800 font-medium text-lg mb-4">You're all caught up!</p>
                  <Button
                    onClick={() => setBookingDialogOpen(true)}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white`}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Find a Specialist
                  </Button>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => {
                  // Handle both API response (doctorId as object) and mock data (doctorId as string)
                  const doctor = typeof appointment.doctorId === 'object' && appointment.doctorId?.name
                    ? appointment.doctorId
                    : mockUsers.find(u => u.id === appointment.doctorId);

                  return (
                    <div key={appointment._id || appointment.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white hover:bg-emerald-50 transition-colors shadow-sm">
                      <div className="flex items-center space-x-4">
                        <Avatar className="border-2 border-emerald-400 h-12 w-12">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-base">
                            {doctor?.name ? doctor.name.split(' ').map((n: string) => n[0]).join('') : 'Dr'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            Dr. {doctor?.name || 'Doctor'}
                          </p>
                          <p className="text-sm text-gray-600">{doctor?.specialization || doctor?.role || 'General Practitioner'}</p>
                          <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(appointment.date)} @ {appointment.time ? formatTime(appointment.time) : 'Time not set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-600 text-emerald-600 hover:bg-emerald-100"
                          onClick={() => handleManageAppointment(appointment)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Removed duplicate empty state that was always showing */}
              {false && upcomingAppointments.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-emerald-300 rounded-lg bg-emerald-50/50">
                  <Calendar className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                  <p className="text-emerald-800 font-medium text-lg mb-4">You're all caught up!</p>
                  <Button
                    onClick={() => setBookingDialogOpen(true)}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white`}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Find a Specialist
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Prescriptions (Teal Theme) */}
        <Card className="border-teal-200 shadow-xl bg-white">
          <CardHeader className="bg-teal-50 border-b border-teal-100 p-4">
            <CardTitle className="flex items-center text-xl font-bold text-teal-800">
              <ClipboardList className={`h-6 w-6 text-${PractoSecondary} mr-3`} />
              Recent Digital Records
            </CardTitle>
            <CardDescription className="text-sm text-teal-700">
              Latest prescriptions and health records.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {prescriptionsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : patientPrescriptions.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50/50 py-4">
                  <ClipboardList className="mx-auto h-12 w-12 text-teal-500 mb-4" />
                  <p className="text-teal-800 font-medium text-lg">No records yet. All records will appear here.</p>
                </div>
              ) : (
                patientPrescriptions.slice(0, 5).map((prescription) => {
                  // Handle both API data (doctor as object) and mock data (doctorId)
                  const doctor = typeof prescription.doctor === 'object' && prescription.doctor !== null
                    ? prescription.doctor
                    : mockUsers.find(u => u.id === prescription.doctorId);

                  // Handle both API data (medicines) and mock data (medications)
                  const medications = prescription.medicines || prescription.medications || [];

                  // Handle both API data (createdAt) and mock data (date)
                  const prescriptionDate = prescription.createdAt
                    ? new Date(prescription.createdAt).toLocaleDateString()
                    : prescription.date;

                  // Get diagnosis from notes or use default
                  const diagnosis = prescription.diagnosis || prescription.notes || 'Medical Prescription';

                  return (
                    <div key={prescription._id || prescription.id} className="p-4 border border-gray-100 rounded-xl bg-white hover:bg-teal-50 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{diagnosis}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Dr. {doctor?.name || 'Unknown'} {doctor?.specialization ? `(${doctor.specialization})` : ''}
                          </p>
                          <p className="text-xs text-teal-600 flex items-center mt-1">
                            <FileText className="h-3 w-3 mr-1" />
                            Issued: {prescriptionDate}
                          </p>
                        </div>
                        <Button variant="default" size="sm" className={`bg-teal-500 hover:bg-teal-600 text-white font-semibold`}>
                          View Rx
                        </Button>
                      </div>

                      {/* Medication Preview */}
                      <div className="mt-3 pt-3 border-t border-teal-100">
                        {medications.slice(0, 2).map((med: any, index: number) => (
                          <p key={index} className="text-sm text-gray-800 flex items-center">
                            <Pill className="h-3 w-3 mr-2 text-teal-500" />
                            <span className="font-medium">{med.name}</span> <span className="text-gray-500 ml-2">({med.dosage})</span>
                          </p>
                        ))}
                        {medications.length > 2 && (
                          <p className="text-xs text-teal-600 pt-1 text-center">
                            +{medications.length - 2} medications
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Health Summary */}
      <Card className="border-blue-200 shadow-xl bg-white" style={{ margin: "40px 0" }}>
        <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
          <CardTitle className="flex items-center text-xl font-bold text-blue-800">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            My Health Profile Snapshot
          </CardTitle>
          <CardDescription className="text-sm text-blue-700">
            Critical information for emergency access. Visit "My Profile" tab to update.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Type */}
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-red-500 shadow-sm">
              <h4 className="font-semibold mb-1 text-gray-700 flex items-center">
                <Droplet className="h-5 w-5 mr-2 text-red-500" />
                Blood Group
              </h4>
              <p className="text-2xl font-extrabold text-red-600">
                {(user as any)?.bloodGroup || 'Not set'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(user as any)?.bloodGroup ? 'Keep this updated' : (
                  <span className="text-amber-600 font-medium">
                    Visit "My Profile" tab to add
                  </span>
                )}
              </p>
            </div>

            {/* Allergies */}
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-amber-500 shadow-sm">
              <h4 className="font-semibold mb-1 text-gray-700 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                Known Allergies
              </h4>
              <p className="text-sm text-gray-900 font-medium">
                {(user as any)?.allergies && (user as any).allergies.length > 0
                  ? (user as any).allergies.join(', ')
                  : 'None recorded'}
              </p>
              <p className="text-xs text-amber-600 mt-1">Review your list for accuracy.</p>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-green-500 shadow-sm">
              <h4 className="font-semibold mb-1 text-gray-700 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-500" />
                Emergency Contact
              </h4>
              {(user as any)?.emergencyContact?.name ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any).emergencyContact.name} ({(user as any).emergencyContact.relationship})
                  </p>
                  <p className="text-lg text-green-600 mt-1 font-mono font-bold">
                    {(user as any).emergencyContact.phone}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-1">No emergency contact set</p>
                  <p className="text-xs text-amber-600 font-medium">
                    Visit "My Profile" tab to add
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Recent Activity Log */}
      <div style={{ margin: "40px 0" }}>
        <RecentActivityLog activities={activities} loading={activitiesLoading} />
      </div>

      {/* Appointment Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <CalendarDays className="mr-2 h-6 w-6 text-emerald-600" />
              Book a New Appointment
            </DialogTitle>
            <DialogDescription>
              Schedule an appointment with one of our healthcare professionals
            </DialogDescription>
          </DialogHeader>
          <AppointmentBookingForm
            onSuccess={handleBookingSuccess}
            onCancel={() => setBookingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Manage Appointment Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Calendar className="mr-2 h-5 w-5 text-emerald-600" />
              Manage Appointment
            </DialogTitle>
            <DialogDescription>
              View details and manage your appointment
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Appointment Details */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-emerald-400">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {(() => {
                          const doctor = typeof selectedAppointment.doctorId === 'object' && selectedAppointment.doctorId?.name
                            ? selectedAppointment.doctorId
                            : mockUsers.find(u => u.id === selectedAppointment.doctorId);
                          return doctor?.name ? doctor.name.split(' ').map((n: string) => n[0]).join('') : 'Dr';
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900">
                        Dr. {(() => {
                          const doctor = typeof selectedAppointment.doctorId === 'object' && selectedAppointment.doctorId?.name
                            ? selectedAppointment.doctorId
                            : mockUsers.find(u => u.id === selectedAppointment.doctorId);
                          return doctor?.name || 'Doctor';
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const doctor = typeof selectedAppointment.doctorId === 'object' && selectedAppointment.doctorId?.name
                            ? selectedAppointment.doctorId
                            : mockUsers.find(u => u.id === selectedAppointment.doctorId);
                          return doctor?.specialization || doctor?.role || 'General Practitioner';
                        })()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mt-3">Date</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-emerald-600" />
                      {formatDate(selectedAppointment.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mt-3">Time</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-emerald-600" />
                      {selectedAppointment.time ? formatTime(selectedAppointment.time) : 'Not specified'}
                    </p>
                  </div>
                </div>

                {(selectedAppointment.reason || selectedAppointment.notes) && (
                  <div className="pt-2 border-t border-emerald-200">
                    <p className="text-xs text-gray-600 font-medium mb-1 mt-3">Reason</p>
                    <p className="text-sm text-gray-900">{selectedAppointment.reason || selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setManageDialogOpen(false)}
                  disabled={cancelLoading}
                >
                  Close
                </Button>
                {selectedAppointment.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-600 hover:bg-red-700 ml-2 text-gray-300"
                    onClick={handleCancelAppointment}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-300" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Appointment'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};