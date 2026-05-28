import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck2, Video } from "lucide-react";
import platformService from "../../services/platformService";

const slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];
const today = new Date().toISOString().slice(0, 10);

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const response = await platformService.getAppointments();
    setAppointments(response.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message || "Unable to load appointments."));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = event.target;
    try {
      await platformService.bookAppointment({
        appointmentDate: form.appointmentDate.value,
        slotLabel: form.slotLabel.value,
        consultationMode: form.consultationMode.value,
        concern: form.concern.value,
        patientNotes: form.patientNotes.value,
      });
      setMessage("Appointment request submitted.");
      form.reset();
      await load();
    } catch (err) {
      setError(err.message || "Unable to book appointment.");
    }
  };

  const cancel = async (id) => {
    setError("");
    try {
      await platformService.cancelAppointment(id);
      setMessage("Appointment cancelled.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to cancel appointment.");
    }
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Appointments</span>
          <h1>Book and manage consultations</h1>
          <p>Request a future slot, join online appointments, or cancel eligible appointments.</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="panel-card">
              <div className="panel-heading"><CalendarCheck2 className="text-primary" /><div><h2 className="panel-title">Request appointment</h2><p className="panel-subtitle">Slots must be in the future.</p></div></div>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6"><label>Date</label><input name="appointmentDate" type="date" min={today} className="form-control" required /></div>
                  <div className="col-md-6"><label>Slot</label><select name="slotLabel" className="form-select" required>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></div>
                  <div className="col-md-6"><label>Type</label><select name="consultationMode" className="form-select"><option value="online">Online</option><option value="clinic">Clinic</option></select></div>
                  <div className="col-md-6"><label>Main concern</label><input name="concern" className="form-control" required /></div>
                  <div className="col-12"><label>Notes</label><textarea name="patientNotes" className="form-control" rows="3" /></div>
                </div>
                {message && <div className="alert alert-success mt-3">{message}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                <button className="btn btn-primary mt-3">Submit request</button>
              </form>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Your appointments</h2>
              <div className="history-list">
                {appointments.length ? appointments.map((item) => (
                  <div className="history-row align-items-start" key={item._id}>
                    <div>
                      <strong>{item.concern}</strong>
                      <div className="muted-copy">{new Date(item.appointmentDate).toLocaleString()} · {item.consultationMode}</div>
                      <div className="muted-copy">Doctor: {item.doctor?.name}</div>
                    </div>
                    <span className={`status-pill status-${item.status}`}>{item.status}</span>
                    <div className="d-flex gap-2 flex-wrap">
                      {item.consultationMode === "online" && item.status === "approved" && !item.callEndedAt && (
                        <Link className="btn btn-primary btn-sm rounded-pill" to={`/appointments/${item._id}/call`}><Video size={15} /> Join Call</Link>
                      )}
                      {["pending", "approved"].includes(item.status) && (
                        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => cancel(item._id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                )) : <p className="muted-copy mb-0">No appointments yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
