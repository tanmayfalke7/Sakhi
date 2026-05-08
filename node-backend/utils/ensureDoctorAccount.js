const User = require('../models/User');

const ensureDoctorAccount = async () => {
  const email = process.env.DOCTOR_EMAIL || 'doctor@sakhihealth.com';
  const password = process.env.DOCTOR_PASSWORD || 'Doctor@123';
  const name = process.env.DOCTOR_NAME || 'Dr. Sakhi';

  const existingDoctor = await User.findByEmail(email, { includePassword: true });

  if (existingDoctor) {
    if (existingDoctor.role !== 'doctor') {
      await User.updateById(existingDoctor._id, { role: 'doctor' });
    }
    return existingDoctor;
  }

  const doctor = await User.create({
    name,
    email,
    password,
    role: 'doctor',
    profile: {
      city: 'Sakhi Care Center',
    },
  });

  console.log(`Seeded doctor account: ${email}`);
  return doctor;
};

module.exports = ensureDoctorAccount;
