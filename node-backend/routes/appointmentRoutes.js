const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);
router.get('/', getAppointments);
router.post('/', authorize('patient'), createAppointment);
router.patch('/:id/status', authorize('doctor'), updateAppointmentStatus);

module.exports = router;
