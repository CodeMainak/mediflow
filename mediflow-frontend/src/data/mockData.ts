import { User, Patient, Appointment, Prescription, Notification } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'dr.smith@mediflow.com',
    name: 'Dr. John Smith',
    role: 'doctor',
    phone: '+1-555-0101',
    specialization: 'Cardiology'
  },
  {
    id: '2',
    email: 'dr.johnson@mediflow.com',
    name: 'Dr. Sarah Johnson',
    role: 'doctor',
    phone: '+1-555-0102',
    specialization: 'Dermatology'
  },
  {
    id: '3',
    email: 'jane.doe@email.com',
    name: 'Jane Doe',
    role: 'patient',
    phone: '+1-555-0201'
  },
  {
    id: '4',
    email: 'mike.brown@email.com',
    name: 'Mike Brown',
    role: 'patient',
    phone: '+1-555-0202'
  },
  {
    id: '5',
    email: 'receptionist@mediflow.com',
    name: 'Lisa Wilson',
    role: 'receptionist',
    phone: '+1-555-0301',
    department: 'Front Desk'
  }
];

export const mockPatients: Patient[] = [
  {
    id: '3',
    name: 'Jane Doe',
    age: 32,
    gender: 'female',
    phone: '+1-555-0201',
    email: 'jane.doe@email.com',
    address: '123 Main St, City, State 12345',
    medicalHistory: ['Hypertension', 'Diabetes Type 2'],
    allergies: ['Penicillin', 'Shellfish'],
    bloodType: 'A+',
    emergencyContact: {
      name: 'John Doe',
      phone: '+1-555-0203',
      relation: 'Spouse'
    },
    assignedDoctorId: '1'
  },
  {
    id: '4',
    name: 'Mike Brown',
    age: 45,
    gender: 'male',
    phone: '+1-555-0202',
    email: 'mike.brown@email.com',
    address: '456 Oak Ave, City, State 12345',
    medicalHistory: ['Asthma', 'High Cholesterol'],
    allergies: ['Peanuts'],
    bloodType: 'O-',
    emergencyContact: {
      name: 'Sarah Brown',
      phone: '+1-555-0204',
      relation: 'Wife'
    },
    assignedDoctorId: '2'
  },
  {
    id: '6',
    name: 'Emily Chen',
    age: 28,
    gender: 'female',
    phone: '+1-555-0205',
    email: 'emily.chen@email.com',
    address: '789 Pine St, City, State 12345',
    medicalHistory: [],
    allergies: [],
    bloodType: 'B+',
    emergencyContact: {
      name: 'David Chen',
      phone: '+1-555-0206',
      relation: 'Brother'
    },
    assignedDoctorId: '1'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '3',
    doctorId: '1',
    date: '2024-12-15',
    time: '09:00',
    duration: 30,
    status: 'confirmed',
    reason: 'Regular checkup',
    type: 'consultation'
  },
  {
    id: '2',
    patientId: '4',
    doctorId: '2',
    date: '2024-12-15',
    time: '10:30',
    duration: 45,
    status: 'pending',
    reason: 'Skin rash examination',
    type: 'consultation'
  },
  {
    id: '3',
    patientId: '6',
    doctorId: '1',
    date: '2024-12-16',
    time: '14:00',
    duration: 30,
    status: 'confirmed',
    reason: 'Follow-up consultation',
    type: 'follow-up'
  }
];

export const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    patientId: '3',
    doctorId: '1',
    appointmentId: '1',
    date: '2024-12-10',
    diagnosis: 'Hypertension management',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in the morning with food'
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take with meals'
      }
    ],
    notes: 'Monitor blood pressure and blood sugar levels',
    followUpDate: '2024-12-24'
  },
  {
    id: '2',
    patientId: '4',
    doctorId: '2',
    date: '2024-12-08',
    diagnosis: 'Eczema flare-up',
    medications: [
      {
        name: 'Hydrocortisone Cream',
        dosage: '1%',
        frequency: 'Twice daily',
        duration: '14 days',
        instructions: 'Apply thin layer to affected areas'
      }
    ],
    notes: 'Avoid known allergens',
    followUpDate: '2024-12-22'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'New Appointment Request',
    message: 'Jane Doe has requested an appointment for tomorrow at 9:00 AM',
    type: 'appointment',
    read: false,
    createdAt: '2024-12-14T10:30:00Z'
  },
  {
    id: '2',
    userId: '3',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Smith on Dec 15 at 9:00 AM has been confirmed',
    type: 'appointment',
    read: false,
    createdAt: '2024-12-14T11:00:00Z'
  },
  {
    id: '3',
    userId: '4',
    title: 'Prescription Ready',
    message: 'Your prescription from Dr. Johnson is ready for pickup',
    type: 'prescription',
    read: true,
    createdAt: '2024-12-13T15:30:00Z'
  }
];