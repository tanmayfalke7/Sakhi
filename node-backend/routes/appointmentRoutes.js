const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  startAppointmentCall,
  endAppointmentCall,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);
router.get('/', getAppointments);
router.post('/', authorize('patient'), createAppointment);
router.patch('/:id/cancel', authorize('patient'), cancelAppointment);
router.post('/:id/call/start', startAppointmentCall);
router.post('/:id/call/end', authorize('doctor'), endAppointmentCall);
router.patch('/:id/status', authorize('doctor'), updateAppointmentStatus);

module.exports = router;
