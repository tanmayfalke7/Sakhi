const { query } = require('../config/database');
const User = require('./User');

const toAppointment = (row) =>
  row && {
    _id: String(row.id),
    patient: String(row.patient_id),
    doctor: String(row.doctor_id),
    appointmentDate: row.appointment_date,
    slotLabel: row.slot_label,
    consultationMode: row.consultation_mode,
    concern: row.concern,
    patientNotes: row.patient_notes || '',
    status: row.status,
    doctorRemarks: row.doctor_remarks || '',
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const attachUsers = async (appointment, { doctor = false, patient = false } = {}) => {
  if (!appointment) return null;
  const item = { ...appointment };
  if (doctor) {
    item.doctor = await User.findById(appointment.doctor);
  }
  if (patient) {
    item.patient = await User.findById(appointment.patient);
  }
  return item;
};

const create = async ({ patient, doctor, appointmentDate, slotLabel, consultationMode = 'online', concern, patientNotes = '' }) => {
  const result = await query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, slot_label, consultation_mode, concern, patient_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patient, doctor, appointmentDate, slotLabel, consultationMode, concern, patientNotes]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const rows = await query('SELECT * FROM appointments WHERE id = ?', [id]);
  return toAppointment(rows[0]);
};

const findConflict = async ({ doctor, appointmentDate, slotLabel }) => {
  const rows = await query(
    `SELECT * FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND slot_label = ?
       AND status IN ('requested', 'approved', 'completed')
     LIMIT 1`,
    [doctor, appointmentDate, slotLabel]
  );
  return toAppointment(rows[0]);
};

const listForUser = async (user, { limit, order = 'DESC' } = {}) => {
  const column = user.role === 'doctor' ? 'doctor_id' : 'patient_id';
  const safeLimit = limit ? Math.max(1, Number.parseInt(limit, 10) || 25) : null;
  const rows = await query(
    `SELECT * FROM appointments WHERE ${column} = ? ORDER BY appointment_date ${order}${safeLimit ? ` LIMIT ${safeLimit}` : ''}`,
    [user._id]
  );
  const appointments = rows.map(toAppointment);
  return Promise.all(appointments.map((item) => attachUsers(item, { doctor: true, patient: true })));
};

const listForPatient = async (patientId, { limit = 25 } = {}) => {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 25);
  const rows = await query(`SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT ${safeLimit}`, [patientId]);
  return Promise.all(rows.map(toAppointment).map((item) => attachUsers(item, { doctor: true })));
};

const listForDoctorPatient = async (doctorId, patientId) => {
  const rows = await query(
    'SELECT * FROM appointments WHERE doctor_id = ? AND patient_id = ? ORDER BY appointment_date DESC',
    [doctorId, patientId]
  );
  return rows.map(toAppointment);
};

const upcomingForPatient = async (patientId) => {
  const rows = await query(
    `SELECT * FROM appointments
     WHERE patient_id = ? AND status IN ('requested', 'approved')
     ORDER BY appointment_date ASC LIMIT 3`,
    [patientId]
  );
  return Promise.all(rows.map(toAppointment).map((item) => attachUsers(item, { doctor: true })));
};

const todayForDoctor = async (doctorId, start, end) => {
  const rows = await query(
    `SELECT * FROM appointments
     WHERE doctor_id = ? AND appointment_date >= ? AND appointment_date <= ?
     ORDER BY appointment_date ASC`,
    [doctorId, start, end]
  );
  return Promise.all(rows.map(toAppointment).map((item) => attachUsers(item, { patient: true })));
};

const countForDoctor = async (doctorId) => {
  const rows = await query('SELECT COUNT(*) AS count FROM appointments WHERE doctor_id = ?', [doctorId]);
  return rows[0].count;
};

const updateStatus = async (id, doctorId, { status, doctorRemarks }) => {
  const appointment = await findById(id);
  if (!appointment || appointment.doctor !== String(doctorId)) {
    return null;
  }

  await query(
    `UPDATE appointments
     SET status = ?, doctor_remarks = COALESCE(?, doctor_remarks), completed_at = ?
     WHERE id = ? AND doctor_id = ?`,
    [status, doctorRemarks ?? null, status === 'completed' ? new Date() : null, id, doctorId]
  );

  return findById(id);
};

module.exports = {
  create,
  findById,
  findConflict,
  listForUser,
  listForPatient,
  listForDoctorPatient,
  upcomingForPatient,
  todayForDoctor,
  countForDoctor,
  updateStatus,
  attachUsers,
  toAppointment,
};
