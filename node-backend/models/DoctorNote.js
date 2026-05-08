const { query } = require('../config/database');
const User = require('./User');
const Appointment = require('./Appointment');

const toNote = (row) =>
  row && {
    _id: String(row.id),
    doctor: String(row.doctor_id),
    patient: String(row.patient_id),
    appointment: row.appointment_id ? String(row.appointment_id) : undefined,
    title: row.title,
    content: row.content,
    followUpDate: row.follow_up_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const hydrate = async (note) => {
  if (!note) return null;
  const item = { ...note };
  item.patient = await User.findById(note.patient);
  if (note.appointment) {
    item.appointment = await Appointment.findById(note.appointment);
  }
  return item;
};

const create = async ({ doctor, patient, appointment, title, content, followUpDate }) => {
  const result = await query(
    `INSERT INTO doctor_notes (doctor_id, patient_id, appointment_id, title, content, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [doctor, patient, appointment || null, title, content, followUpDate || null]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const rows = await query('SELECT * FROM doctor_notes WHERE id = ?', [id]);
  return toNote(rows[0]);
};

const listForDoctor = async (doctorId, patientId) => {
  const rows = await query(
    `SELECT * FROM doctor_notes WHERE doctor_id = ?${patientId ? ' AND patient_id = ?' : ''} ORDER BY created_at DESC`,
    patientId ? [doctorId, patientId] : [doctorId]
  );
  return Promise.all(rows.map(toNote).map(hydrate));
};

const listForPatientDoctor = async (patientId, doctorId) => {
  const rows = await query(
    'SELECT * FROM doctor_notes WHERE patient_id = ? AND doctor_id = ? ORDER BY created_at DESC',
    [patientId, doctorId]
  );
  return rows.map(toNote);
};

module.exports = {
  create,
  listForDoctor,
  listForPatientDoctor,
  toNote,
};
