const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

const calculateBmi = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) {
    return null;
  }

  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

exports.getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    ['name', 'phone', 'avatarUrl'].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.profile) {
      const mergedProfile = {
        ...req.user.profile,
        ...req.body.profile,
      };
      const bmi = calculateBmi(mergedProfile.heightCm, mergedProfile.weightKg);
      updates.profile = {
        ...mergedProfile,
        ...(bmi ? { bmi } : {}),
      };
    }

    const user = await User.updateById(req.user._id, updates);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.listByUser(req.user._id, { limit: 20 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.markRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const [upcomingAppointments, predictionCount, latestPrediction, notifications] = await Promise.all([
      Appointment.upcomingForPatient(req.user._id),
      Prediction.countByUser(req.user._id),
      Prediction.latestByUser(req.user._id),
      Notification.listByUser(req.user._id, { unreadOnly: true, limit: 5 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        profile: req.user,
        stats: {
          predictionCount,
          unreadNotifications: notifications.length,
          bmi: calculateBmi(req.user.profile?.heightCm, req.user.profile?.weightKg),
        },
        latestPrediction,
        upcomingAppointments,
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealthHistory = async (req, res, next) => {
  try {
    const [predictions, appointments] = await Promise.all([
      Prediction.listByUser(req.user._id, 25),
      Appointment.listForPatient(req.user._id, { limit: 25 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        predictions,
        appointments,
      },
    });
  } catch (error) {
    next(error);
  }
};
