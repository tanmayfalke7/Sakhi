const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');

const getDoctor = async () => {
  const configured = await User.findByEmail(process.env.DOCTOR_EMAIL || 'doctor@sakhihealth.com');
  return configured?.role === 'doctor' ? configured : User.findDoctor();
};

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

    const dateValue = new Date(appointmentDate);
    if (Number.isNaN(dateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid appointment date',
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

    await createNotification({
      user: updated.patient,
      type: 'appointment',
      title: `Appointment ${status}`,
      message: `Your consultation request for ${appointment.slotLabel} has been marked as ${status}.`,
      metadata: { appointmentId: updated._id, status },
    });

    const populated = await Appointment.attachUsers(updated, { doctor: true, patient: true });

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
