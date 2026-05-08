const User = require('../models/User');
const Appointment = require('../models/Appointment');
const CommunityPost = require('../models/CommunityPost');
const DoctorNote = require('../models/DoctorNote');
const Prediction = require('../models/Prediction');

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const [totalUsers, totalAppointments, todaySchedule, recentPosts, riskDistribution, patients] =
      await Promise.all([
        User.countPatients(),
        Appointment.countForDoctor(req.user._id),
        Appointment.todayForDoctor(req.user._id, startOfDay(today), endOfDay(today)),
        CommunityPost.listActive({ limit: 5 }),
        Prediction.riskDistribution(),
        User.listPatients({ selectAgeOnly: true }),
      ]);

    const ageBuckets = [
      { label: '13-18', min: 13, max: 18, count: 0 },
      { label: '19-25', min: 19, max: 25, count: 0 },
      { label: '26-35', min: 26, max: 35, count: 0 },
      { label: '36+', min: 36, max: 120, count: 0 },
    ];

    patients.forEach((patient) => {
      const age = patient.profile?.age;
      if (!age) {
        return;
      }
      const bucket = ageBuckets.find((item) => age >= item.min && age <= item.max);
      if (bucket) {
        bucket.count += 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAppointments,
        },
        todaySchedule,
        recentPosts,
        riskDistribution,
        ageDistribution: ageBuckets,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const patients = await User.listPatients();

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPatientDetails = async (req, res, next) => {
  try {
    const patient = await User.findById(req.params.id);

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const [appointments, predictions, notes] = await Promise.all([
      Appointment.listForDoctorPatient(req.user._id, patient._id),
      Prediction.listByUser(patient._id),
      DoctorNote.listForPatientDoctor(patient._id, req.user._id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        patient,
        appointments,
        predictions,
        notes,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createDoctorNote = async (req, res, next) => {
  try {
    const { patientId, appointmentId, title, content, followUpDate } = req.body;

    if (!patientId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Patient, title, and note content are required',
      });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const note = await DoctorNote.create({
      doctor: req.user._id,
      patient: patientId,
      appointment: appointmentId || undefined,
      title,
      content,
      followUpDate: followUpDate || undefined,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorNotes = async (req, res, next) => {
  try {
    const notes = await DoctorNote.listForDoctor(req.user._id, req.query.patientId);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};
