import nodemailer from "nodemailer";
import twilio from "twilio";

// Create a transporter using Gmail (you can configure other SMTP providers)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "your-app-password",
    },
});

// Initialize Twilio client (optional - only if SMS is configured)
let twilioClient: twilio.Twilio | null = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} else {
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

// Send email notification
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        const mailOptions = {
            from: `"MediFlow" <${process.env.EMAIL_USER || "noreply@mediflow.com"}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        return false;
    }
};

// Send appointment confirmation email
export const sendAppointmentConfirmation = async (
    patientEmail: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date
) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Appointment Confirmed</h2>
            <p>Dear ${patientName},</p>
            <p>Your appointment has been confirmed with <strong>Dr. ${doctorName}</strong>.</p>
            <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString()}</p>
            <p>Please arrive 10 minutes early for your appointment.</p>
            <br>
            <p>Best regards,<br>MediFlow Team</p>
        </div>
    `;

    return sendEmail({
        to: patientEmail,
        subject: "Appointment Confirmation - MediFlow",
        html,
    });
};

// Send appointment rejection email
export const sendAppointmentRejection = async (
    patientEmail: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date,
    reason?: string
) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Appointment Request Declined</h2>
            <p>Dear ${patientName},</p>
            <p>Unfortunately, your appointment request with <strong>Dr. ${doctorName}</strong> for ${appointmentDate.toLocaleString()} could not be confirmed.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Please try booking another time slot or contact us for assistance.</p>
            <br>
            <p>Best regards,<br>MediFlow Team</p>
        </div>
    `;

    return sendEmail({
        to: patientEmail,
        subject: "Appointment Request Update - MediFlow",
        html,
    });
};

// Send appointment reminder email
export const sendAppointmentReminder = async (
    patientEmail: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date
) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Appointment Reminder</h2>
            <p>Dear ${patientName},</p>
            <p>This is a reminder of your upcoming appointment with <strong>Dr. ${doctorName}</strong>.</p>
            <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString()}</p>
            <p>Please arrive 10 minutes early for your appointment.</p>
            <br>
            <p>Best regards,<br>MediFlow Team</p>
        </div>
    `;

    return sendEmail({
        to: patientEmail,
        subject: "Upcoming Appointment Reminder - MediFlow",
        html,
    });
};

// Send welcome email to new users
export const sendWelcomeEmail = async (
    userEmail: string,
    userName: string,
    userRole: string
) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Welcome to MediFlow!</h2>
            <p>Dear ${userName},</p>
            <p>Thank you for registering with MediFlow as a <strong>${userRole}</strong>.</p>
            <p>You can now access your dashboard and start managing your healthcare needs.</p>
            <br>
            <p>If you have any questions, feel free to contact our support team.</p>
            <br>
            <p>Best regards,<br>MediFlow Team</p>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: "Welcome to MediFlow",
        html,
    });
};

// Send prescription notification
export const sendPrescriptionNotification = async (
    patientEmail: string,
    patientName: string,
    doctorName: string
) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">New Prescription Available</h2>
            <p>Dear ${patientName},</p>
            <p><strong>Dr. ${doctorName}</strong> has added a new prescription for you.</p>
            <p>Please log in to your MediFlow account to view the details.</p>
            <br>
            <p>Best regards,<br>MediFlow Team</p>
        </div>
    `;

    return sendEmail({
        to: patientEmail,
        subject: "New Prescription - MediFlow",
        html,
    });
};

/**
 * ========================================
 * SMS NOTIFICATION FUNCTIONS (via Twilio)
 * ========================================
 */

interface SMSOptions {
    to: string;
    message: string;
}

// Send SMS notification
export const sendSMS = async (options: SMSOptions): Promise<boolean> => {
    if (!twilioClient) {
        return false;
    }

    try {
        const fromNumber = process.env['TWILIO_PHONE_NUMBER'];

        if (!fromNumber) {
            return false;
        }

        await twilioClient.messages.create({
            body: options.message,
            from: fromNumber,
            to: options.to,
        });

        return true;
    } catch (error) {
        return false;
    }
};

// Send appointment confirmation SMS
export const sendAppointmentConfirmationSMS = async (
    phoneNumber: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date
) => {
    const message = `Hi ${patientName}, your appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleString()} has been confirmed. Please arrive 10 minutes early. - MediFlow`;

    return sendSMS({
        to: phoneNumber,
        message,
    });
};

// Send appointment reminder SMS
export const sendAppointmentReminderSMS = async (
    phoneNumber: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date
) => {
    const message = `Reminder: Hi ${patientName}, you have an appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleString()}. See you soon! - MediFlow`;

    return sendSMS({
        to: phoneNumber,
        message,
    });
};

// Send appointment cancellation SMS
export const sendAppointmentCancellationSMS = async (
    phoneNumber: string,
    patientName: string,
    appointmentDate: Date
) => {
    const message = `Hi ${patientName}, your appointment on ${appointmentDate.toLocaleString()} has been cancelled. Please contact us to reschedule. - MediFlow`;

    return sendSMS({
        to: phoneNumber,
        message,
    });
};

// Send prescription notification SMS
export const sendPrescriptionNotificationSMS = async (
    phoneNumber: string,
    patientName: string,
    doctorName: string
) => {
    const message = `Hi ${patientName}, Dr. ${doctorName} has added a new prescription for you. Please check your MediFlow account for details. - MediFlow`;

    return sendSMS({
        to: phoneNumber,
        message,
    });
};

/**
 * Combined notification function - sends both email and SMS
 */
export const sendCombinedReminder = async (
    email: string,
    phone: string | undefined,
    patientName: string,
    doctorName: string,
    appointmentDate: Date
) => {
    // Always send email
    const emailSent = await sendAppointmentReminder(
        email,
        patientName,
        doctorName,
        appointmentDate
    );

    // Send SMS if phone number is provided
    let smsSent = false;
    if (phone) {
        smsSent = await sendAppointmentReminderSMS(
            phone,
            patientName,
            doctorName,
            appointmentDate
        );
    }

    return {
        emailSent,
        smsSent,
    };
};
