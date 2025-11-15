import { getAppointments } from './appointmentService';
import { getPatientPrescriptions } from './prescriptionService';
import { getDoctors } from './userService';

// Get recent activities for a patient
export const getRecentActivities = async (userId) => {
    try {
        const activities = [];
        let doctorsMap = {};

        // Fetch doctors list to map doctor IDs to names
        try {
            const doctorsResponse = await getDoctors();
            const doctors = Array.isArray(doctorsResponse.data) ? doctorsResponse.data : [];

            // Create a map of doctor IDs to doctor objects for quick lookup
            doctors.forEach(doctor => {
                const doctorId = doctor._id || doctor.user?._id;
                const doctorName = doctor.user?.name || doctor.name;
                if (doctorId) {
                    doctorsMap[doctorId] = {
                        name: doctorName,
                        specialization: doctor.specialization
                    };
                }
            });
        } catch (err) {
            console.error('Error fetching doctors for activity log:', err);
        }

        // Fetch appointments
        try {
            const appointmentsResponse = await getAppointments();
            const appointments = appointmentsResponse.data || [];

            // Convert appointments to activity format
            appointments.forEach(appointment => {
                // Handle both populated object and ID string cases
                let doctorName = 'Unknown Doctor';

                if (typeof appointment.doctorId === 'object' && appointment.doctorId?.name) {
                    // doctorId is already populated with doctor object
                    doctorName = appointment.doctorId.name;
                } else if (typeof appointment.doctorId === 'string') {
                    // doctorId is just an ID string, look it up in the map
                    const doctorInfo = doctorsMap[appointment.doctorId];
                    doctorName = doctorInfo?.name || 'Unknown Doctor';
                }

                activities.push({
                    id: `appointment-${appointment._id}`,
                    type: 'appointment',
                    action: getAppointmentAction(appointment.status),
                    description: `Appointment with Dr. ${doctorName}`,
                    date: appointment.createdAt || appointment.date,
                    status: appointment.status,
                    icon: 'calendar',
                    color: getActivityColor(appointment.status),
                });
            });
        } catch (err) {
            console.error('Error fetching appointments for activity log:', err);
        }

        // Fetch prescriptions
        try {
            if (userId) {
                const prescriptionsResponse = await getPatientPrescriptions(userId);
                const prescriptions = prescriptionsResponse.data || [];

                // Convert prescriptions to activity format
                prescriptions.forEach(prescription => {
                    activities.push({
                        id: `prescription-${prescription._id}`,
                        type: 'prescription',
                        action: 'Prescription Received',
                        description: `${prescription.diagnosis || 'General prescription'}`,
                        date: prescription.createdAt || prescription.date,
                        status: 'completed',
                        icon: 'pill',
                        color: 'text-blue-600',
                    });
                });
            }
        } catch (err) {
            console.error('Error fetching prescriptions for activity log:', err);
        }

        // Sort activities by date (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        return activities;
    } catch (err) {
        console.error('Error fetching activities:', err);
        throw err;
    }
};

// Helper function to determine appointment action based on status
const getAppointmentAction = (status) => {
    switch (status) {
        case 'confirmed':
            return 'Appointment Confirmed';
        case 'pending':
            return 'Appointment Pending';
        case 'cancelled':
            return 'Appointment Cancelled';
        case 'completed':
            return 'Appointment Completed';
        default:
            return 'Appointment Booked';
    }
};

// Helper function to get color based on status
const getActivityColor = (status) => {
    switch (status) {
        case 'confirmed':
            return 'text-green-600';
        case 'pending':
            return 'text-amber-600';
        case 'cancelled':
            return 'text-red-600';
        case 'completed':
            return 'text-blue-600';
        default:
            return 'text-gray-600';
    }
};

// Get recent activities for a doctor (optimized - uses passed appointments data)
export const getDoctorRecentActivities = async (existingAppointments = null) => {
    try {
        const activities = [];

        // Use existing appointments if provided, otherwise fetch
        let appointments = existingAppointments;
        if (!appointments) {
            try {
                const appointmentsResponse = await getAppointments();
                appointments = appointmentsResponse.data || [];
            } catch (err) {
                console.error('Error fetching appointments for doctor activity log:', err);
                appointments = [];
            }
        }

        // Convert appointments to activity format for doctors
        appointments.forEach(appointment => {
            // Get patient name
            let patientName = 'Unknown Patient';
            if (typeof appointment.patientId === 'object' && appointment.patientId?.name) {
                patientName = appointment.patientId.name;
            }

            // Different activity types based on appointment status and actions
            if (appointment.status === 'confirmed') {
                activities.push({
                    id: `appointment-confirmed-${appointment._id}`,
                    type: 'appointment',
                    action: 'confirmed',
                    patientName: patientName,
                    description: `Appointment confirmed with ${patientName}`,
                    date: appointment.updatedAt || appointment.createdAt || appointment.date,
                    status: appointment.status,
                    icon: 'check-circle',
                    reason: appointment.reason || appointment.notes,
                });
            }

            // For newly created/pending appointments
            if (appointment.status === 'pending' && appointment.createdAt) {
                activities.push({
                    id: `appointment-pending-${appointment._id}`,
                    type: 'appointment',
                    action: 'pending',
                    patientName: patientName,
                    description: `New appointment request from ${patientName}`,
                    date: appointment.createdAt,
                    status: appointment.status,
                    icon: 'calendar',
                    reason: appointment.reason || appointment.notes,
                });
            }
        });

        // Note: Prescriptions endpoint requires patientId, so we skip fetching all prescriptions
        // for now. Prescription activities could be added when a doctor-specific endpoint is available.

        // Sort activities by date (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Return only the most recent 10 activities
        return activities.slice(0, 10);
    } catch (err) {
        console.error('Error fetching doctor activities:', err);
        return []; // Return empty array instead of throwing
    }
};
