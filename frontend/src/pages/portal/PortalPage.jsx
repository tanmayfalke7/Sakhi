import { useEffect, useState } from "react";
import { Bell, CalendarCheck2, HeartPulse, Scale, Sparkles } from "lucide-react";
import platformService from "../../services/platformService";
import authService from "../../services/authService";

const slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];
const toNumberOrUndefined = (value) => (value === "" ? undefined : Number(value));

export default function PortalPage() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState({ predictions: [], appointments: [] });
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [profileMessage, setProfileMessage] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const user = authService.getStoredUser();

  const loadPortal = async () => {
    const [dashboardRes, historyRes, notificationsRes, appointmentsRes] = await Promise.all([
      platformService.getPatientDashboard(),
      platformService.getHistory(),
      platformService.getNotifications(),
      platformService.getAppointments(),
    ]);

    setDashboard(dashboardRes.data);
    setHistory(historyRes.data);
    setNotifications(notificationsRes.data);
    setAppointments(appointmentsRes.data);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPortal();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    await platformService.updateProfile({
      name: form.name.value,
      phone: form.phone.value,
      profile: {
        age: toNumberOrUndefined(form.age.value),
        heightCm: toNumberOrUndefined(form.heightCm.value),
        weightKg: toNumberOrUndefined(form.weightKg.value),
        city: form.city.value,
        cycleRegularity: form.cycleRegularity.value,
        lifestyle: form.lifestyle.value,
        symptoms: form.symptoms.value,
      },
    });

    setProfileMessage("Profile updated successfully.");
    await loadPortal();
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    await platformService.bookAppointment({
      appointmentDate: form.appointmentDate.value,
      slotLabel: form.slotLabel.value,
      consultationMode: form.consultationMode.value,
      concern: form.concern.value,
      patientNotes: form.patientNotes.value,
    });

    setAppointmentMessage("Appointment request submitted.");
    form.reset();
    await loadPortal();
  };

  const markRead = async (id) => {
    await platformService.markNotificationRead(id);
    await loadPortal();
  };

  if (loading) {
    return <section className="page-shell"><div className="container py-5">Loading dashboard...</div></section>;
  }

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Patient dashboard</span>
          <h1>Welcome back, {dashboard?.profile?.name || user?.name}</h1>
          <p>Track assessments, update your health profile, request a consultation, and keep your care history in one place.</p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="metric-card">
              <Sparkles size={18} />
              <strong>{dashboard?.stats?.predictionCount || 0}</strong>
              <span>Assessments saved</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <Bell size={18} />
              <strong>{dashboard?.stats?.unreadNotifications || 0}</strong>
              <span>Unread notifications</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <Scale size={18} />
              <strong>{dashboard?.stats?.bmi || "NA"}</strong>
              <span>Current BMI snapshot</span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="panel-card">
              <div className="panel-heading">
                <HeartPulse className="text-primary" />
                <div>
                  <h2 className="panel-title">Health profile</h2>
                  <p className="panel-subtitle">This helps the doctor review your context before each consultation.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>Name</label>
                    <input name="name" defaultValue={dashboard?.profile?.name || ""} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label>Phone</label>
                    <input name="phone" defaultValue={dashboard?.profile?.phone || ""} className="form-control" />
                  </div>
                  <div className="col-md-4">
                    <label>Age</label>
                    <input name="age" type="number" defaultValue={dashboard?.profile?.profile?.age || ""} className="form-control" />
                  </div>
                  <div className="col-md-4">
                    <label>Height (cm)</label>
                    <input name="heightCm" type="number" defaultValue={dashboard?.profile?.profile?.heightCm || ""} className="form-control" />
                  </div>
                  <div className="col-md-4">
                    <label>Weight (kg)</label>
                    <input name="weightKg" type="number" defaultValue={dashboard?.profile?.profile?.weightKg || ""} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label>City</label>
                    <input name="city" defaultValue={dashboard?.profile?.profile?.city || ""} className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label>Cycle regularity</label>
                    <input name="cycleRegularity" defaultValue={dashboard?.profile?.profile?.cycleRegularity || ""} className="form-control" />
                  </div>
                  <div className="col-12">
                    <label>Lifestyle notes</label>
                    <textarea name="lifestyle" defaultValue={dashboard?.profile?.profile?.lifestyle || ""} className="form-control" rows="2" />
                  </div>
                  <div className="col-12">
                    <label>Symptoms</label>
                    <textarea name="symptoms" defaultValue={dashboard?.profile?.profile?.symptoms || ""} className="form-control" rows="2" />
                  </div>
                </div>
                {profileMessage && <div className="alert alert-success mt-3">{profileMessage}</div>}
                <button className="btn btn-primary mt-3">Save profile</button>
              </form>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="panel-card">
              <div className="panel-heading">
                <CalendarCheck2 className="text-primary" />
                <div>
                  <h2 className="panel-title">Request appointment</h2>
                  <p className="panel-subtitle">Choose a date, slot, and consultation mode for the assigned doctor.</p>
                </div>
              </div>

              <form onSubmit={handleAppointmentSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>Date</label>
                    <input name="appointmentDate" type="date" className="form-control" required />
                  </div>
                  <div className="col-md-6">
                    <label>Slot</label>
                    <select name="slotLabel" className="form-select" required>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label>Mode</label>
                    <select name="consultationMode" className="form-select">
                      <option value="online">Online</option>
                      <option value="clinic">Clinic</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label>Main concern</label>
                    <input name="concern" className="form-control" placeholder="Irregular cycles, acne, follow-up..." required />
                  </div>
                  <div className="col-12">
                    <label>Notes for doctor</label>
                    <textarea name="patientNotes" className="form-control" rows="3" />
                  </div>
                </div>
                {appointmentMessage && <div className="alert alert-success mt-3">{appointmentMessage}</div>}
                <button className="btn btn-primary mt-3">Submit request</button>
              </form>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-7">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Assessment history</h2>
              <div className="history-list">
                {history.predictions?.length ? history.predictions.map((item) => (
                  <div className="history-row" key={item._id}>
                    <div>
                      <strong>{item.assessmentType.toUpperCase()}</strong>
                      <div className="muted-copy">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`status-pill status-${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
                    <div>{item.riskPercentage}%</div>
                  </div>
                )) : <p className="muted-copy mb-0">No assessments saved yet.</p>}
              </div>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Appointment history</h2>
              <div className="history-list">
                {appointments?.length ? appointments.map((item) => (
                  <div className="history-row" key={item._id}>
                    <div>
                      <strong>{item.concern}</strong>
                      <div className="muted-copy">{new Date(item.appointmentDate).toLocaleDateString()} at {item.slotLabel}</div>
                    </div>
                    <span className={`status-pill status-${item.status}`}>{item.status}</span>
                  </div>
                )) : <p className="muted-copy mb-0">No appointments booked yet.</p>}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Notifications</h2>
              <div className="notification-list">
                {notifications?.length ? notifications.map((item) => (
                  <button
                    key={item._id}
                    className={`notification-item ${item.isRead ? "is-read" : ""}`}
                    onClick={() => markRead(item._id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </button>
                )) : <p className="muted-copy mb-0">You are all caught up.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
