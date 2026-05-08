const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDoctorDashboard,
  getPatients,
  getPatientDetails,
  createDoctorNote,
  getDoctorNotes,
} = require('../controllers/doctorController');

const router = express.Router();

router.use(protect, authorize('doctor'));
router.get('/dashboard', getDoctorDashboard);
router.get('/patients', getPatients);
router.get('/patients/:id', getPatientDetails);
router.get('/notes', getDoctorNotes);
router.post('/notes', createDoctorNote);

module.exports = router;
