import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Video } from "lucide-react";
import platformService from "../../services/platformService";

const actions = ["approved", "rejected", "completed"];

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const response = await platformService.getAppointments();
    setAppointments(response.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message || "Unable to load appointments."));
  }, []);

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await platformService.updateAppointmentStatus(id, { status });
      await load();
    } catch (err) {
      setError(err.message || "Unable to update appointment.");
    }
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Doctor appointments</span>
          <h1>Appointment queue</h1>
          <p>Review patient appointment details, update status, and start online consultations.</p>
        </div>

        <div className="panel-card">
          <div className="panel-heading">
            <ClipboardList className="text-primary" />
            <div><h2 className="panel-title">Patient appointments</h2><p className="panel-subtitle">Pending means no doctor action has been taken yet.</p></div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="history-list">
            {appointments.map((appointment) => (
              <div className="history-row align-items-start" key={appointment._id}>
                <div>
                  <strong>{appointment.patient?.name}</strong>
                  <div className="muted-copy">{appointment.patient?.email}</div>
                  <div>{appointment.concern}</div>
                  <div className="muted-copy">{new Date(appointment.appointmentDate).toLocaleString()} · {appointment.consultationMode}</div>
                </div>
                <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                <div className="d-flex gap-2 flex-wrap justify-content-end">
                  {actions.map((action) => (
                    <button key={action} className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => updateStatus(appointment._id, action)}>
                      {action}
                    </button>
                  ))}
                  {appointment.consultationMode === "online" && appointment.status === "approved" && !appointment.callEndedAt && (
                    <Link className="btn btn-primary btn-sm rounded-pill" to={`/doctor/appointments/${appointment._id}/call`}><Video size={15} /> Start Call</Link>
                  )}
                </div>
              </div>
            ))}
            {!appointments.length && <p className="muted-copy mb-0">No appointments found.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
