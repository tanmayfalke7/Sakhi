const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const client = getTransporter();
  if (!client || !to) {
    return null;
  }

  return client.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

const sendAppointmentApprovedEmail = async ({ appointment, patient, doctor }) => {
  const appointmentDate = new Date(appointment.appointmentDate);
  const dateText = appointmentDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeText = appointmentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return sendMail({
    to: patient.email,
    subject: 'Your Sakhi appointment is confirmed',
    text: `Your appointment with ${doctor.name} is confirmed for ${dateText} at ${timeText}. Type: ${appointment.consultationMode}. Concern: ${appointment.concern}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2237">
        <h2>Your Sakhi appointment is confirmed</h2>
        <p>Hello ${patient.name}, your consultation request has been approved.</p>
        <ul>
          <li><strong>Doctor:</strong> ${doctor.name}</li>
          <li><strong>Date:</strong> ${dateText}</li>
          <li><strong>Time:</strong> ${timeText}</li>
          <li><strong>Appointment type:</strong> ${appointment.consultationMode}</li>
          <li><strong>Concern:</strong> ${appointment.concern}</li>
        </ul>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendAppointmentApprovedEmail,
};
