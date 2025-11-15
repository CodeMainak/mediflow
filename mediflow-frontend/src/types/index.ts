export type UserRole = 'doctor' | 'patient' | 'receptionist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  specialization?: string; // for doctors
  department?: string; // for receptionists
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: string[];
  allergies: string[];
  bloodType: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  assignedDoctorId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  notes?: string;
  type: 'consultation' | 'follow-up' | 'emergency';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  followUpDate?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'reminder' | 'alert';
  read: boolean;
  createdAt: string;
}