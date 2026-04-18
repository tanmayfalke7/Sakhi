const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', registerUser);

// POST /api/auth/login - Login user
router.post('/login', loginUser);

// POST /api/auth/logout - Logout user (protected)
router.post('/logout', protect, logoutUser);

// GET /api/auth/me - Get current user (protected)
router.get('/me', protect, getMe);

module.exports = router;
