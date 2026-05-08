const express = require('express');
const {
  getProfile,
  updateProfile,
  getDashboard,
  getNotifications,
  markNotificationRead,
  getHealthHistory,
} = require('../controllers/userController');

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/history', getHealthHistory);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

module.exports = router;
