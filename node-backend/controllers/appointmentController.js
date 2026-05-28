const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');
const { sendAppointmentApprovedEmail } = require('../utils/emailService');

const getDoctor = async () => {
  const configured = await User.findByEmail(process.env.DOCTOR_EMAIL || 'doctor@sakhihealth.com');
  return configured?.role === 'doctor' ? configured : User.findDoctor();
};

const parseAppointmentDateTime = (appointmentDate, slotLabel) => {
  const dateText = String(appointmentDate || '').slice(0, 10);
  const slot = String(slotLabel || '').trim();
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!dateText || !match) {
    return new Date(appointmentDate);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const [year, month, day] = dateText.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const makeRoomId = ({ patient, doctor, appointmentDate }) =>
  `sakhi-${doctor}-${patient}-${new Date(appointmentDate).getTime()}`;

exports.createAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, slotLabel, concern, consultationMode, patientNotes } = req.body;

    if (!appointmentDate || !slotLabel || !concern) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date, slot, and concern are required',
      });
    }

    const doctor = await getDoctor();
    if (!doctor) {
      return res.status(500).json({
        success: false,
        message: 'Doctor account is not configured yet',
      });
    }

    const dateValue = parseAppointmentDateTime(appointmentDate, slotLabel);
    if (Number.isNaN(dateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid appointment date',
      });
    }

    if (dateValue <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be booked for future time slots',
      });
    }

    const conflict = await Appointment.findConflict({
      doctor: doctor._id,
      appointmentDate: dateValue,
      slotLabel,
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'That appointment slot is already taken',
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      appointmentDate: dateValue,
      slotLabel,
      concern,
      consultationMode: consultationMode || 'online',
      patientNotes: patientNotes || '',
      callRoomId: makeRoomId({ patient: req.user._id, doctor: doctor._id, appointmentDate: dateValue }),
    });

    await createNotification({
      user: req.user._id,
      type: 'appointment',
      title: 'Appointment request received',
      message: 'Your consultation request has been submitted and is waiting for doctor approval.',
      metadata: { appointmentId: appointment._id },
    });

    const populated = await Appointment.attachUsers(appointment, { doctor: true, patient: true });

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.listForUser(req.user, {
      order: req.user.role === 'doctor' ? 'ASC' : 'DESC',
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, doctorRemarks } = req.body;
    const validStatuses = ['approved', 'rejected', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status',
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || appointment.doctor !== String(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const updated = await Appointment.updateStatus(req.params.id, req.user._id, { status, doctorRemarks });
    const populated = await Appointment.attachUsers(updated, { doctor: true, patient: true });

    await createNotification({
      user: updated.patient,
      type: 'appointment',
      title: `Appointment ${status}`,
      message: `Your consultation request for ${appointment.slotLabel} has been marked as ${status}.`,
      metadata: { appointmentId: updated._id, status },
    });

    if (status === 'approved') {
      await sendAppointmentApprovedEmail({
        appointment: populated,
        patient: populated.patient,
        doctor: populated.doctor,
      }).catch((emailError) => {
        console.error(`Appointment approval email failed: ${emailError.message}`);
      });
    }

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || appointment.patient !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!['pending', 'approved'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Only pending or approved appointments can be cancelled' });
    }

    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (new Date(appointment.appointmentDate).getTime() - Date.now() < twoHoursMs) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment with less than 2 hours remaining before the appointment.',
      });
    }

    const updated = await Appointment.cancelByPatient(req.params.id, req.user._id);

    await createNotification({
      user: appointment.doctor,
      type: 'appointment',
      title: 'Appointment cancelled',
      message: `${req.user.name} cancelled the appointment for ${appointment.slotLabel}.`,
      metadata: { appointmentId: appointment._id, status: 'cancelled' },
    });

    res.status(200).json({
      success: true,
      data: await Appointment.attachUsers(updated, { doctor: true, patient: true }),
    });
  } catch (error) {
    next(error);
  }
};

exports.startAppointmentCall = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const canJoin = appointment.doctor === String(req.user._id) || appointment.patient === String(req.user._id);
    if (!canJoin || appointment.status !== 'approved' || appointment.consultationMode !== 'online') {
      return res.status(403).json({ success: false, message: 'This online appointment is not available to join' });
    }

    const updated = await Appointment.markCallStarted(req.params.id);
    res.status(200).json({
      success: true,
      data: await Appointment.attachUsers(updated, { doctor: true, patient: true }),
    });
  } catch (error) {
    next(error);
  }
};

exports.endAppointmentCall = async (req, res, next) => {
  try {
    const updated = await Appointment.endCall(req.params.id, req.user._id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await createNotification({
      user: updated.patient,
      type: 'appointment',
      title: 'Video consultation ended',
      message: 'Your doctor ended the video consultation.',
      metadata: { appointmentId: updated._id, status: 'completed' },
    });

    res.status(200).json({
      success: true,
      data: await Appointment.attachUsers(updated, { doctor: true, patient: true }),
    });
  } catch (error) {
    next(error);
  }
};
