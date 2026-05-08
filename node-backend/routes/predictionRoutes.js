const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  predictPcos,
  predictThyroid,
  getMyPredictions,
} = require('../controllers/predictionController');

const router = express.Router();

router.use(protect, authorize('patient', 'doctor'));
router.get('/mine', getMyPredictions);
router.post('/pcos', predictPcos);
router.post('/thyroid', predictThyroid);

module.exports = router;
