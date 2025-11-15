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
  Users,
  Clock,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Phone,
  Stethoscope,
  Heart,
  Activity,
  Shield,
  HeartHandshake,
  Pill,
  UserCheck,
  Thermometer,
  Microscope,
  CalendarDays,
  Loader2,
  Mail,
} from 'lucide-react';
import { mockAppointments, mockPatients, mockUsers } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { AppointmentBookingForm } from '../appointments/AppointmentBookingForm';
import { AddDoctorForm } from '../forms/AddDoctorForm';
import { AddPatientForm } from '../forms/AddPatientForm';
import { CheckInPatientForm } from '../forms/CheckInPatientForm';
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService';
import { getDoctors } from '../../services/userService';
import { toast } from 'sonner';

export const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [addDoctorDialogOpen, setAddDoctorDialogOpen] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await getAppointments();
        setAppointments(response.data || []);
      } catch (err: any) {
        toast.error('Failed to load appointments');
        // Fallback to mock data if API fails
        setAppointments(mockAppointments);
      }
    };

    fetchAppointments();
  }, []);

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await getDoctors();
        const doctorsData = Array.isArray(response.data) ? response.data : [];
        setDoctors(doctorsData);
      } catch (err: any) {
        toast.error('Failed to load doctors');
        // Fallback to mock data if API fails
        setDoctors(mockUsers.filter(u => u.role === 'doctor'));
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch patients from API (using all users with role 'patient')
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin/users?role=Patient', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        setPatients(data.data || []);
      } catch (err: any) {
        toast.error('Failed to load patients');
        // Fallback to mock data if API fails
        setPatients(mockPatients);
      }
    };

    fetchPatients();
  }, []);

  // Calculate derived data from appointments
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date).toISOString().split('T')[0];
    return aptDate === todayDate;
  });

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  // Get recent patients (last 5)
  const recentPatients = patients.slice(-5);

  // Handler to refresh appointments after booking
  const handleBookingSuccess = async () => {
    setBookingDialogOpen(false);
    toast.success('Appointment scheduled successfully!');
    // Refresh appointments data
    try {
      const response = await getAppointments();
      setAppointments(response.data || []);
    } catch (err) {
    }
  };

  // Handler to refresh doctors after adding
  const handleAddDoctorSuccess = async () => {
    setAddDoctorDialogOpen(false);
    toast.success('Doctor added successfully!');
    // Refresh doctors data
    try {
      const response = await getDoctors();
      const doctorsData = Array.isArray(response.data) ? response.data : [];
      setDoctors(doctorsData);
    } catch (err) {
    }
  };

  // Handler to refresh patients after adding
  const handleAddPatientSuccess = async () => {
    setAddPatientDialogOpen(false);
    toast.success('Patient added successfully!');
    // Refresh patients data
    try {
      const response = await fetch('http://localhost:8000/api/admin/users?role=Patient', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
    } catch (err) {
    }
  };

  // Handler to refresh appointments after check-in
  const handleCheckInSuccess = async () => {
    setCheckInDialogOpen(false);
    toast.success('Patient checked in successfully!');
    // Refresh appointments data
    try {
      const response = await getAppointments();
      setAppointments(response.data || []);
    } catch (err) {
    }
  };

  // Handler to view doctor schedule
  const handleViewSchedule = (doctor: any) => {
    setSelectedDoctor(doctor);
    setScheduleDialogOpen(true);
  };

  // Handler to approve appointment
  const handleApproveAppointment = async (appointmentId: string) => {
    setProcessingAction({ id: appointmentId, action: 'approve' });
    try {
      await updateAppointmentStatus(appointmentId, 'confirmed');
      toast.success('Appointment approved successfully!');

      // Refresh appointments list
      const response = await getAppointments();
      setAppointments(response.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to approve appointment');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handler to reject appointment
  const handleRejectAppointment = async (appointmentId: string) => {
    setProcessingAction({ id: appointmentId, action: 'reject' });
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled');
      toast.success('Appointment rejected successfully!');

      // Refresh appointments list
      const response = await getAppointments();
      setAppointments(response.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to reject appointment');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getUrgencyColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-l-4 border-red-500';
      case 'follow-up': return 'border-l-4 border-blue-500';
      default: return 'border-l-4 border-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <UserCheck className="h-6 w-6" />
              </div>
              Welcome, {user?.name}
            </h2>
            <p className="text-green-100 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Reception dashboard - Manage patients and appointments
            </p>
          </div>
          <div className="hidden md:flex space-x-4">
            <div className="bg-white/10 p-3 rounded-full">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <div className="bg-white/10 p-3 rounded-full">
              <Shield className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Today's Appointments</CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{todayAppointments.length}</div>
            <p className="text-xs text-green-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              {confirmedAppointments.length} confirmed, {pendingAppointments.length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Patients</CardTitle>
            <div className="bg-emerald-100 p-2 rounded-full">
              <HeartHandshake className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : patients.length}</div>
            <p className="text-xs text-emerald-600 flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              Registered patients
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Pending Approvals</CardTitle>
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{pendingAppointments.length}</div>
            <p className="text-xs text-amber-600 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-900">Available Doctors</CardTitle>
            <div className="bg-teal-100 p-2 rounded-full">
              <Stethoscope className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-800">{doctors.length}</div>
            <p className="text-xs text-teal-600 flex items-center">
              <UserCheck className="h-3 w-3 mr-1" />
              Active physicians
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center mt-4">
              <Clock className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              All appointments scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                todayAppointments.map((appointment: any) => {
                  // Handle both populated object and ID string for patient
                  const patient = typeof appointment.patientId === 'object' && appointment.patientId?.name
                    ? appointment.patientId
                    : patients.find(p => p.id === appointment.patientId || p._id === appointment.patientId);

                  // Handle both populated object and ID string for doctor
                  const doctor = typeof appointment.doctorId === 'object' && appointment.doctorId?.name
                    ? appointment.doctorId
                    : doctors.find(d => d.id === appointment.doctorId || d._id === appointment.doctorId);

                  return (
                    <div key={appointment._id || appointment.id} className={`p-3 border rounded-lg ${getUrgencyColor(appointment.type)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="font-bold text-lg">{appointment.time || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{appointment.duration || 30}m</div>
                          </div>
                          <div>
                            <p className="font-medium">{patient?.name || 'Unknown Patient'}</p>
                            <p className="text-sm text-muted-foreground">
                              with {doctor?.name || 'Unknown Doctor'}
                            </p>
                            <p className="text-xs text-gray-600">{appointment.reason || appointment.notes || 'No reason provided'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.status === 'pending' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleApproveAppointment(appointment._id || appointment.id)}
                                disabled={processingAction !== null}
                              >
                                {processingAction?.id === (appointment._id || appointment.id) && processingAction?.action === 'approve' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectAppointment(appointment._id || appointment.id)}
                                disabled={processingAction !== null}
                              >
                                {processingAction?.id === (appointment._id || appointment.id) && processingAction?.action === 'reject' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Reject'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {!loading && todayAppointments.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No appointments scheduled for today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center mt-4">
              <Users className="mr-2 h-5 w-5" />
              Recent Patients
            </CardTitle>
            <CardDescription>
              Recently registered or updated patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : recentPatients.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No patients registered yet
                </p>
              ) : (
                recentPatients.map((patient: any) => {
                  const assignedDoctor = doctors.find((d: any) => d.id === patient.assignedDoctorId || d._id === patient.assignedDoctorId);
                  return (
                    <div key={patient.id || patient._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {patient.name.split(' ').map((n: any) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age || 'N/A'} years old, {patient.gender || 'N/A'}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {patient.phone || 'No phone'}
                          </div>
                          {assignedDoctor && (
                            <p className="text-xs text-blue-600">
                              Assigned to {assignedDoctor.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button
                          onClick={() => setBookingDialogOpen(true)}
                          variant="outline"
                          size="sm"
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center mt-4">
              <UserPlus className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common receptionist tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setAddDoctorDialogOpen(true)}
                // variant="variab"
                className="group h-20 flex flex-col items-center justify-center hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <Stethoscope className="h-6 w-6 mb-2 group-hover:text-white transition-colors" />
                <span className="group-hover:text-white transition-colors">Add Doctor</span>
              </Button>
              <Button
                onClick={() => setBookingDialogOpen(true)}
                variant="outline"
                className="group h-20 flex flex-col items-center justify-center hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <Calendar className="h-6 w-6 mb-2 group-hover:text-white transition-colors" />
                <span className="group-hover:text-white transition-colors">Schedule Appointment</span>
              </Button>
              <Button
                onClick={() => setAddPatientDialogOpen(true)}
                variant="outline"
                className="group h-20 flex flex-col items-center justify-center hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <UserPlus className="h-6 w-6 mb-2 group-hover:text-white transition-colors" />
                <span className="group-hover:text-white transition-colors">Add Patient</span>
              </Button>
              <Button
                onClick={() => setCheckInDialogOpen(true)}
                variant="outline"
                className="group h-20 flex flex-col items-center justify-center hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <CheckCircle className="h-6 w-6 mb-2 group-hover:text-white transition-colors" />
                <span className="group-hover:text-white transition-colors">Check-in Patient</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center mt-4">
              <Clock className="mr-2 h-5 w-5" />
              Doctor Availability
            </CardTitle>
            <CardDescription>
              Current status of all doctors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : doctors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No doctors available
                </p>
              ) : (
                doctors.map((doctor: any) => {
                  const doctorAppointments = todayAppointments.filter((apt: any) => {
                    const doctorId = typeof apt.doctorId === 'object' ? apt.doctorId._id : apt.doctorId;
                    return doctorId === doctor._id || doctorId === doctor.id;
                  });
                  const isAvailable = doctorAppointments.length === 0;

                  return (
                    <div key={doctor._id || doctor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {doctor.name.split(' ').map((n: any) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.specialization || 'General Practice'}</p>
                          <p className="text-xs text-muted-foreground">{doctor.phone || doctor.user?.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={isAvailable ? "secondary" : "destructive"}>
                          {isAvailable ? 'Available' : `${doctorAppointments.length} appointments`}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSchedule(doctor)}
                        >
                          View Schedule
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <CalendarDays className="mr-2 h-6 w-6 text-emerald-600" />
              Schedule New Appointment
            </DialogTitle>
            <DialogDescription>
              Book an appointment for a patient with a healthcare professional
            </DialogDescription>
          </DialogHeader>
          <AppointmentBookingForm
            onSuccess={handleBookingSuccess}
            onCancel={() => setBookingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={addDoctorDialogOpen} onOpenChange={setAddDoctorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Stethoscope className="mr-2 h-6 w-6 text-emerald-600" />
              Add New Doctor
            </DialogTitle>
            <DialogDescription>
              Register a new doctor in the system with their credentials and specialization
            </DialogDescription>
          </DialogHeader>
          <AddDoctorForm
            onSuccess={handleAddDoctorSuccess}
            onCancel={() => setAddDoctorDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={addPatientDialogOpen} onOpenChange={setAddPatientDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <UserPlus className="mr-2 h-6 w-6 text-emerald-600" />
              Add New Patient
            </DialogTitle>
            <DialogDescription>
              Register a new patient in the system with their personal and medical information
            </DialogDescription>
          </DialogHeader>
          <AddPatientForm
            onSuccess={handleAddPatientSuccess}
            onCancel={() => setAddPatientDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Check-in Patient Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <CheckCircle className="mr-2 h-6 w-6 text-emerald-600" />
              Check-in Patient
            </DialogTitle>
            <DialogDescription>
              Check in a patient for their scheduled appointment today
            </DialogDescription>
          </DialogHeader>
          <CheckInPatientForm
            onSuccess={handleCheckInSuccess}
            onCancel={() => setCheckInDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Doctor Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Calendar className="mr-2 h-6 w-6 text-emerald-600" />
              {selectedDoctor?.name}'s Schedule
            </DialogTitle>
            <DialogDescription>
              View all appointments for {selectedDoctor?.name} ({selectedDoctor?.specialization || 'General Practice'})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Doctor Info Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 ring-2 ring-emerald-500">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                      {selectedDoctor?.name.split(' ').map((n: any) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-emerald-900">{selectedDoctor?.name}</h3>
                    <p className="text-emerald-700 font-medium">{selectedDoctor?.specialization || 'General Practice'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-emerald-600">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {selectedDoctor?.phone || selectedDoctor?.user?.phone || 'No phone'}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {selectedDoctor?.email || selectedDoctor?.user?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments List */}
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-emerald-600" />
                All Appointments
              </h4>
              <div className="space-y-3">
                {appointments
                  .filter((apt: any) => {
                    const doctorId = typeof apt.doctorId === 'object' ? apt.doctorId._id : apt.doctorId;
                    return doctorId === selectedDoctor?._id || doctorId === selectedDoctor?.id;
                  })
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((appointment: any) => {
                    const patient = typeof appointment.patientId === 'object' && appointment.patientId?.name
                      ? appointment.patientId
                      : patients.find((p: any) => p.id === appointment.patientId || p._id === appointment.patientId);

                    const appointmentDate = new Date(appointment.date);
                    const isToday = appointmentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    const isPast = appointmentDate < new Date() && !isToday;

                    return (
                      <Card key={appointment._id || appointment.id} className={`${isToday ? 'border-emerald-300 bg-emerald-50' : isPast ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-center min-w-[80px]">
                                <div className="font-bold text-lg text-emerald-700">
                                  {appointment.time || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {appointmentDate.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                {isToday && <Badge className="mt-1 bg-emerald-600 text-white text-xs">Today</Badge>}
                              </div>
                              <div className="border-l pl-4">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {patient?.name?.split(' ').map((n: any) => n[0]).join('') || 'P'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-gray-900">{patient?.name || 'Unknown Patient'}</p>
                                    <p className="text-sm text-gray-600">{appointment.reason || appointment.notes || 'General consultation'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {appointments.filter((apt: any) => {
                  const doctorId = typeof apt.doctorId === 'object' ? apt.doctorId._id : apt.doctorId;
                  return doctorId === selectedDoctor?._id || doctorId === selectedDoctor?.id;
                }).length === 0 && (
                    <Card className="bg-gray-50">
                      <CardContent className="p-8 text-center">
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600">No appointments scheduled for this doctor</p>
                      </CardContent>
                    </Card>
                  )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setScheduleDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 