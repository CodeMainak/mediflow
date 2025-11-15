import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Heart,
  Pill,
  Activity,
  UserCheck,
  Thermometer,
  HeartHandshake, // Retaining HeartHandshake for the 'logo' concept
  Shield,
  User,
  Syringe,
  ClipboardCheck,
  History,
  XCircle,
  ListChecks,
  Loader2,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments } from '../../services/appointmentService';
import { PendingAppointments } from '../appointments/PendingAppointments';
import { toast } from 'sonner';
import { getDoctorRecentActivities } from '../../services/activityService';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Fetch appointments and activities together (optimized)
  const fetchData = async () => {
    try {
      setLoading(true);
      setActivitiesLoading(true);

      // Fetch appointments once
      const appointmentsRes = await getAppointments();
      const appointmentsData = appointmentsRes.data || [];
      setAppointments(appointmentsData);

      // Pass appointments to activities to avoid duplicate API call
      const activitiesData = await getDoctorRecentActivities(appointmentsData);
      setActivities(activitiesData || []);

    } catch (err: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handler to refresh appointments after status update
  const handleStatusUpdate = () => {
    fetchData(); // Refresh all data (appointments + activities)
  };

  const todayAppointments = appointments.filter(apt =>
    new Date(apt.date).toDateString() === new Date().toDateString()
  );

  // Show upcoming appointments
  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.date) >= new Date()
  ).slice(0, 7);

  // Calculate unique patients from appointments
  const uniquePatients = new Set(appointments.map(apt => apt.patientId?._id || apt.patientId)).size;

  // Get recent patients (unique patients from recent appointments)
  const getRecentPatients = () => {
    const patientMap = new Map();

    // Sort appointments by date (most recent first)
    const sortedAppointments = [...appointments].sort((a, b) =>
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );

    // Get unique patients from recent appointments
    sortedAppointments.forEach(apt => {
      const patient = apt.patientId;
      const patientId = typeof patient === 'object' ? patient?._id : patient;

      if (patientId && !patientMap.has(patientId)) {
        patientMap.set(patientId, {
          ...patient,
          lastAppointment: apt.date,
          appointmentCount: 1,
        });
      } else if (patientId && patientMap.has(patientId)) {
        const existing = patientMap.get(patientId);
        existing.appointmentCount += 1;
      }
    });

    return Array.from(patientMap.values()).slice(0, 5);
  };

  const recentPatients = getRecentPatients();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Function to get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <ClipboardCheck className="h-3 w-3 mr-1" />;
      case 'pending': return <History className="h-3 w-3 mr-1" />;
      case 'cancelled': return <XCircle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  // Function to format relative time
  const formatRelativeTime = (date: Date | string) => {
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInMs = now.getTime() - past.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      }
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } catch {
      return 'recently';
    }
  };


  return (
    <div className="space-y-6">
      {/* Welcome Banner: IMPROVED CONTRAST AND ICON VISIBILITY */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              {/* FIX: Solid white background and dark icons for contrast */}
              <div className="flex items-center bg-white p-2 rounded-full mr-3 shadow-md">
                <Stethoscope className="h-6 w-6 text-green-700 mr-0.5" />
                <HeartHandshake className="h-6 w-6 text-emerald-900" />
              </div>
              Welcome, Dr. {user?.name}
            </h2>
            <p className="text-green-100 flex items-center text-sm">
              <ListChecks className="h-4 w-4 mr-2" />
              Your medical practice hub. Efficiently manage appointments, patient profiles, and care activities.
            </p>
          </div>
          <div className="hidden md:flex space-x-4">
            <div className="bg-white/10 p-3 rounded-full tooltip" title="Overall Activity">
              <Activity className="h-8 w-8" />
            </div>
            <div className="bg-white/10 p-3 rounded-full tooltip" title="Security & Compliance">
              <Shield className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards: Added CardDescription for context and clearer icon focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md pt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-green-900">Today's Appointments</CardTitle>
              <CardDescription className="text-xs text-green-700">Scheduled visits for today</CardDescription>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{todayAppointments.length}</div>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <CheckCircle className="h-4 w-4 mr-1 text-emerald-500" /> {/* Added explicit text-emerald for better contrast */}
              <span className="font-medium">{todayAppointments.filter(apt => apt.status === 'confirmed').length}</span> confirmed
            </p>
          </CardContent>
        </Card>

        {/* Total Patients */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md pt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-emerald-900">Total Patients</CardTitle>
              <CardDescription className="text-xs text-emerald-700">Patients under your care</CardDescription>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800">{uniquePatients}</div>
            <p className="text-sm text-emerald-600 flex items-center mt-1">
              <Users className="h-4 w-4 mr-1" />
              Managed profiles
            </p>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md pt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-teal-900">Total Prescriptions</CardTitle>
              <CardDescription className="text-xs text-teal-700">Prescriptions issued this period</CardDescription>
            </div>
            <div className="bg-teal-100 p-3 rounded-full">
              <Syringe className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-800">0</div>
            <p className="text-sm text-teal-600 flex items-center mt-1">
              <FileText className="h-4 w-4 mr-1" />
              Recent scripts
            </p>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md pt-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-amber-900">Pending Actions</CardTitle>
              <CardDescription className="text-xs text-amber-700">Items requiring your attention</CardDescription>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800">
              {appointments.filter((apt: any) => apt.status === 'pending').length}
            </div>
            <p className="text-sm text-amber-600 flex items-center mt-1">
              <History className="h-4 w-4 mr-1" />
              Pending appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Appointment Requests */}
      <PendingAppointments
        appointments={appointments}
        onStatusUpdate={handleStatusUpdate}
        loading={loading}
      />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments List */}
        <Card className="border-green-200 shadow-md">
          <CardHeader className="bg-green-50/70 mt-4">
            <CardTitle className="flex items-center text-lg font-semibold text-green-900">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              Upcoming Appointments
            </CardTitle>
            <CardDescription className="text-sm text-green-700">
              Your detailed schedule for the next few days (showing first {upcomingAppointments.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => {
                  const patient = appointment.patientId;
                  return (
                    <div key={appointment._id} className="flex items-center justify-between p-3 border border-green-100 rounded-xl bg-white hover:bg-green-50 transition-colors shadow-sm">
                      <div className="flex items-center space-x-3">
                        <Avatar className="border-2 border-green-300 h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-700 font-medium text-sm">
                            {patient?.name ? patient.name.split(' ').map((n: string) => n[0]).join('') : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-green-900">{patient?.name || 'Patient'}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <Thermometer className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-xs">{appointment.reason || appointment.notes || 'No details'}</span>
                          </p>
                          <p className="text-xs text-green-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="font-mono">{new Date(appointment.date).toLocaleDateString()}</span> at <span className="font-mono ml-1">{appointment.time || new Date(appointment.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(appointment.status)} text-xs font-medium flex items-center gap-1`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-green-400" />
                  No upcoming appointments scheduled.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients List */}
        <Card className="border-emerald-200 shadow-md">
          <CardHeader className="bg-emerald-50/70 mt-4">
            <CardTitle className="flex items-center text-lg font-semibold text-emerald-900">
              <div className="bg-emerald-100 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              Recent Patients
            </CardTitle>
            <CardDescription className="text-sm text-emerald-700">
              The latest patients from your recent appointments (showing first 5).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : recentPatients.length > 0 ? (
                recentPatients.map((patient: any) => (
                  <div key={patient._id} className="flex items-center justify-between p-3 border border-emerald-100 rounded-xl bg-white hover:bg-emerald-50 transition-colors shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Avatar className="border-2 border-emerald-300 h-10 w-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium text-sm">
                          {patient?.name ? patient.name.split(' ').map((n: string) => n[0]).join('') : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-emerald-900">{patient?.name || 'Unknown Patient'}</p>
                        <p className="text-xs text-emerald-600 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Last visit: {new Date(patient.lastAppointment).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-emerald-500">
                          {patient.appointmentCount} appointment{patient.appointmentCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {patient.bloodGroup && (
                        <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs">
                          {patient.bloodGroup}
                        </Badge>
                      )}
                      {patient.phone && (
                        <p className="text-xs text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {patient.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  <User className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
                  No patients yet. Patients will appear here after appointments are scheduled.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card: DYNAMIC DATA */}
      <Card className="border-teal-200 shadow-md">
        <CardHeader className="bg-teal-50/70 mt-4">
          <CardTitle className="flex items-center text-lg font-semibold text-teal-900">
            <div className="bg-teal-100 p-2 rounded-full mr-3">
              <Activity className="h-5 w-5 text-teal-600" />
            </div>
            Recent Activity Log
          </CardTitle>
          <CardDescription className="text-sm text-teal-700">
            A chronological summary of your recent actions and important system updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {activitiesLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {activities.map((activity: any) => {
                // Determine icon based on activity type and action
                const getActivityIcon = () => {
                  if (activity.type === 'prescription') {
                    return <Pill className="h-5 w-5 text-teal-700" />;
                  } else if (activity.action === 'confirmed') {
                    return <CheckCircle className="h-5 w-5 text-teal-700" />;
                  } else if (activity.action === 'pending') {
                    return <Calendar className="h-5 w-5 text-teal-700" />;
                  }
                  return <UserCheck className="h-5 w-5 text-teal-700" />;
                };

                // Determine description text
                const getActivityDescription = () => {
                  if (activity.type === 'prescription') {
                    return (
                      <>
                        Prescription created for <span className="font-semibold">{activity.patientName}</span>
                      </>
                    );
                  } else if (activity.action === 'confirmed') {
                    return (
                      <>
                        Appointment confirmed with <span className="font-semibold">{activity.patientName}</span>
                      </>
                    );
                  } else if (activity.action === 'pending') {
                    return (
                      <>
                        New appointment request from <span className="font-semibold">{activity.patientName}</span>
                      </>
                    );
                  }
                  return activity.description;
                };

                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 border border-teal-100 rounded-lg hover:bg-teal-50 transition-colors">
                    {getActivityIcon()}
                    <p className="text-sm font-medium text-teal-900 flex-1">
                      {getActivityDescription()}
                    </p>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(activity.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6 text-sm">
              <Activity className="h-5 w-5 mx-auto mb-2 text-teal-400" />
              No recent activities found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};