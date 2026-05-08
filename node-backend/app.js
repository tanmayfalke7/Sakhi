require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const communityRoutes = require('./routes/communityRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const { protect } = require('./middleware/authMiddleware');
const ensureDoctorAccount = require('./utils/ensureDoctorAccount');

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/doctor', doctorRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Sakhi Platform API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      predictions: '/api/predictions',
      appointments: '/api/appointments',
      community: '/api/community',
      doctor: '/api/doctor',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureDoctorAccount();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
