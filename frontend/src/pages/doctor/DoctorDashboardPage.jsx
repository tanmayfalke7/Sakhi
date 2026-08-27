import { useEffect, useState } from "react";
import { Activity, ClipboardList, Stethoscope, Users } from "lucide-react";
import platformService from "../../services/platformService";

const appointmentActions = ["approved", "rejected", "completed"];

export default function DoctorDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

  const loadDoctorData = async () => {
    const [dashboardRes, appointmentsRes, patientsRes, notesRes] = await Promise.all([
      platformService.getDoctorDashboard(),
      platformService.getAppointments(),
      platformService.getDoctorPatients(),
      platformService.getDoctorNotes(),
    ]);

    setDashboard(dashboardRes.data);
    setAppointments(appointmentsRes.data);
    setPatients(patientsRes.data);
    setNotes(notesRes.data);
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  useEffect(() => {
    const loadPatientDetails = async () => {
      if (!selectedPatient) {
        setSelectedPatientDetails(null);
        return;
      }

      const response = await platformService.getDoctorPatientDetails(selectedPatient);
      setSelectedPatientDetails(response.data);
    };

    loadPatientDetails();
  }, [selectedPatient]);

  const updateStatus = async (appointmentId, status) => {
    await platformService.updateAppointmentStatus(appointmentId, { status });
    await loadDoctorData();
    if (selectedPatient) {
      const response = await platformService.getDoctorPatientDetails(selectedPatient);
      setSelectedPatientDetails(response.data);
    }
  };

  const submitNote = async (event) => {
    event.preventDefault();
    const form = event.target;

    await platformService.createDoctorNote({
      patientId: form.patientId.value,
      title: form.title.value,
      content: form.content.value,
      followUpDate: form.followUpDate.value || undefined,
    });

    form.reset();
    await loadDoctorData();
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Doctor admin</span>
          <h1>Single-doctor operations dashboard</h1>
          <p>Review today's schedule, manage patient notes, and monitor platform activity.</p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="metric-card">
              <Users size={18} />
              <strong>{dashboard?.stats?.totalUsers || 0}</strong>
              <span>Registered patients</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <ClipboardList size={18} />
              <strong>{dashboard?.stats?.totalAppointments || 0}</strong>
              <span>Total appointments</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <Activity size={18} />
              <strong>{dashboard?.todaySchedule?.length || 0}</strong>
              <span>Today’s schedule</span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Appointments</h2>
              <p className="panel-subtitle">Use the dedicated appointments page for approvals, status updates, and video calls.</p>
              <div className="history-list">
                {appointments.map((appointment) => (
                  <div className="panel-card alt-surface mb-3" key={appointment._id}>
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div>
                        <strong>{appointment.patient?.name}</strong>
                        <div className="muted-copy">{appointment.concern}</div>
                        <div className="muted-copy">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.slotLabel}
                        </div>
                      </div>
                      <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    </div>
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      {appointmentActions.map((action) => (
                        <button key={action} className="btn btn-outline-primary rounded-pill btn-sm" onClick={() => updateStatus(appointment._id, action)}>
                          Mark {action}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Risk distribution</h2>
              {(dashboard?.riskDistribution || []).map((item) => (
                <div className="graph-row" key={item._id}>
                  <span>{item._id}</span>
                  <div className="graph-bar">
                    <div className="graph-bar-fill" style={{ width: `${Math.min(item.count * 12, 100)}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}

              <h2 className="panel-title mt-4 mb-3">Age distribution</h2>
              {(dashboard?.ageDistribution || []).map((item) => (
                <div className="graph-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="graph-bar">
                    <div className="graph-bar-fill soft" style={{ width: `${Math.min(item.count * 16, 100)}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="panel-card">
              <div className="panel-heading">
                <Stethoscope className="text-primary" />
                <div>
                  <h2 className="panel-title">Private doctor notes</h2>
                  <p className="panel-subtitle">Only the doctor can see these consultation remarks.</p>
                </div>
              </div>

              <form onSubmit={submitNote}>
                <select name="patientId" className="form-select mb-3" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} required>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>{patient.name}</option>
                  ))}
                </select>
                <input name="title" className="form-control mb-3" placeholder="Note title" required />
                <textarea name="content" className="form-control mb-3" rows="4" placeholder="Observed symptoms, recommended tests, follow-up guidance..." required />
                <input name="followUpDate" type="date" className="form-control mb-3" />
                <button className="btn btn-primary w-100">Save private note</button>
              </form>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Recent notes</h2>
              <div className="history-list">
                {notes.slice(0, 5).map((note) => (
                  <div className="history-row align-items-start" key={note._id}>
                    <div>
                      <strong>{note.title}</strong>
                      <div className="muted-copy">{note.patient?.name}</div>
                      <div className="muted-copy">{note.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPatientDetails && (
              <div className="panel-card mt-4">
                <h2 className="panel-title mb-3">Patient snapshot</h2>
                <p><strong>{selectedPatientDetails.patient.name}</strong></p>
                <p className="muted-copy">Age: {selectedPatientDetails.patient.profile?.age || "NA"} | City: {selectedPatientDetails.patient.profile?.city || "NA"}</p>
                <p className="muted-copy">Latest predictions: {selectedPatientDetails.predictions.length}</p>
                <p className="muted-copy">Appointments: {selectedPatientDetails.appointments.length}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
