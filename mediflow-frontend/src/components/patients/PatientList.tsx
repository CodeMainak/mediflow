import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  Stethoscope,
  Activity,
  Thermometer,
  Shield,
  HeartHandshake,
  UserCheck,
  Pill,
  Users,
  Loader2
} from 'lucide-react';
import { mockPatients, mockUsers } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { getPatients } from '../../services/userService';
import { getAppointments } from '../../services/appointmentService';
import { toast } from 'sonner';

export const PatientList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);

        // Different logic based on user role
        if (user?.role?.toLowerCase() === 'doctor') {
          // For doctors, get unique patients from their appointments
          const appointmentsRes = await getAppointments();
          const appointments = appointmentsRes.data || [];

          // Extract unique patients from appointments
          const uniquePatientsMap = new Map();
          appointments.forEach((apt: any) => {
            const patient = apt.patientId;
            if (patient && typeof patient === 'object' && patient._id) {
              uniquePatientsMap.set(patient._id, patient);
            }
          });

          const uniquePatients = Array.from(uniquePatientsMap.values());
          setPatients(uniquePatients);

        } else {
          // For receptionist/admin, fetch all patients
          const response = await getPatients();
          setPatients(response.data.data || []);
        }

      } catch (err: any) {

        // Check if it's a permission error
        if (err.response?.status === 403 || err.response?.status === 401) {
          toast.error('You do not have permission to view patients');
          setPatients([]);
        } else {
          toast.error('Failed to load patients. Please try again.');
          setPatients([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPatients();
    }
  }, [user]);

  // Filter patients based on user role and search
  const getFilteredPatients = () => {
    let filteredList = patients;

    // If doctor, filter by appointments (patients they have appointments with)
    // For now, show all patients since we don't have doctor-patient assignment in the User model
    // This can be enhanced with appointment data later

    // Apply search filter
    if (searchTerm) {
      filteredList = filteredList.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
      );
    }

    return filteredList;
  };

  const filteredPatients = getFilteredPatients();
  const selectedPatientData = selectedPatient
    ? patients.find(p => p._id === selectedPatient)
    : null;

  const getBloodTypeColor = (bloodType: string) => {
    const colors = {
      'A+': 'bg-red-100 text-red-800 border border-red-200',
      'A-': 'bg-red-200 text-red-900 border border-red-300',
      'B+': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'B-': 'bg-emerald-200 text-emerald-900 border border-emerald-300',
      'O+': 'bg-green-100 text-green-800 border border-green-200',
      'O-': 'bg-green-200 text-green-900 border border-green-300',
      'AB+': 'bg-teal-100 text-teal-800 border border-teal-200',
      'AB-': 'bg-teal-200 text-teal-900 border border-teal-300',
    };
    return colors[bloodType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>
            {user?.role?.toLowerCase() === 'doctor' ? 'My Patients' : 'All Patients'}
          </h2>
          <p className="text-muted-foreground">
            {user?.role?.toLowerCase() === 'doctor'
              ? 'Patients assigned to your care'
              : 'Manage patient information and records'
            }
          </p>
        </div>
        {user?.role?.toLowerCase() === 'receptionist' && (
          <Button className="bg-green-600 hover:bg-green-700">
            <HeartHandshake className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          <Input
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient List</CardTitle>
              <CardDescription>
                {filteredPatients.length} patients found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span className="ml-2 text-gray-600">Loading patients...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPatients.map((patient) => {
                    const isSelected = selectedPatient === patient._id;

                    return (
                      <div
                        key={patient._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted'
                          }`}
                        onClick={() => setSelectedPatient(patient._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {patient.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{patient.name}</h3>
                                {patient.bloodGroup && (
                                  <Badge className={getBloodTypeColor(patient.bloodGroup)}>
                                    {patient.bloodGroup}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                {patient.dateOfBirth && (
                                  <>
                                    <span>{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years old</span>
                                    <span>•</span>
                                  </>
                                )}
                                {patient.gender && (
                                  <span className="capitalize">{patient.gender}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                {patient.phone && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {patient.phone}
                                  </div>
                                )}
                                {patient.email && (
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {patient.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            {patient.allergies && patient.allergies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Allergies
                              </Badge>
                            )}
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                View Profile
                              </Button>
                              {user?.role?.toLowerCase() === 'receptionist' && (
                                <Button size="sm">
                                  Schedule
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredPatients.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No patients found matching your search' : 'No patients found'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedPatientData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>
                      {selectedPatientData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedPatientData.name}
                </CardTitle>
                <CardDescription>Patient Details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedPatientData.phone}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedPatientData.email}
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <span>{selectedPatientData.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Medical Information</h4>
                  <div className="space-y-2">
                    {selectedPatientData.bloodGroup && (
                      <div className="flex justify-between text-sm">
                        <span>Blood Type:</span>
                        <Badge className={getBloodTypeColor(selectedPatientData.bloodGroup)}>
                          {selectedPatientData.bloodGroup}
                        </Badge>
                      </div>
                    )}
                    {selectedPatientData.dateOfBirth && (
                      <div className="flex justify-between text-sm">
                        <span>Age:</span>
                        <span>{new Date().getFullYear() - new Date(selectedPatientData.dateOfBirth).getFullYear()} years</span>
                      </div>
                    )}
                    {selectedPatientData.gender && (
                      <div className="flex justify-between text-sm">
                        <span>Gender:</span>
                        <span className="capitalize">{selectedPatientData.gender}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPatientData.allergies && selectedPatientData.allergies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Allergies
                    </h4>
                    <div className="space-y-1">
                      {selectedPatientData.allergies.map((allergy: string, index: number) => (
                        <Badge key={index} variant="destructive" className="mr-1 mb-1">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPatientData.emergencyContact && selectedPatientData.emergencyContact.name && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Emergency Contact</h4>
                    <div className="text-sm p-3 bg-muted rounded">
                      <div className="font-medium">{selectedPatientData.emergencyContact.name}</div>
                      <div className="text-muted-foreground">{selectedPatientData.emergencyContact.relationship}</div>
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {selectedPatientData.emergencyContact.phone}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button className="flex-1" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a patient to view details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};