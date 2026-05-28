import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarCheck2, Scale, Sparkles } from "lucide-react";
import platformService from "../../services/platformService";
import authService from "../../services/authService";

const maxRisk = (items) => Math.max(100, ...items.map((item) => Number(item.riskPercentage) || 0));

export default function PortalPage() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState({ predictions: [], appointments: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getStoredUser();

  const loadPortal = async () => {
    const [dashboardRes, historyRes, notificationsRes] = await Promise.all([
      platformService.getPatientDashboard(),
      platformService.getHistory(),
      platformService.getNotifications(),
    ]);

    setDashboard(dashboardRes.data);
    setHistory(historyRes.data);
    setNotifications(notificationsRes.data);
  };

  useEffect(() => {
    loadPortal().finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await platformService.markNotificationRead(id);
    await loadPortal();
  };

  const recentPredictions = useMemo(() => (history.predictions || []).slice(0, 6).reverse(), [history.predictions]);
  const riskMax = maxRisk(recentPredictions);
  const profile = dashboard?.profile?.profile || {};

  if (loading) {
    return <section className="page-shell"><div className="container py-5">Loading dashboard...</div></section>;
  }

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Patient dashboard</span>
          <h1>Welcome back, {dashboard?.profile?.name || user?.name}</h1>
          <p>Track health analytics, assessments, appointments, and care notifications.</p>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4"><div className="metric-card"><Sparkles size={18} /><strong>{dashboard?.stats?.predictionCount || 0}</strong><span>Assessments saved</span></div></div>
          <div className="col-md-4"><div className="metric-card"><Bell size={18} /><strong>{dashboard?.stats?.unreadNotifications || 0}</strong><span>Unread notifications</span></div></div>
          <div className="col-md-4"><div className="metric-card"><Scale size={18} /><strong>{dashboard?.stats?.bmi || "NA"}</strong><span>Current BMI snapshot</span></div></div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Health analytics</h2>
              <div className="analytics-grid">
                <div className="analytics-card"><span>Age</span><strong>{profile.age || "NA"}</strong></div>
                <div className="analytics-card"><span>Height</span><strong>{profile.heightCm ? `${profile.heightCm} cm` : "NA"}</strong></div>
                <div className="analytics-card"><span>Weight</span><strong>{profile.weightKg ? `${profile.weightKg} kg` : "NA"}</strong></div>
                <div className="analytics-card"><span>BMI</span><strong>{dashboard?.stats?.bmi || "NA"}</strong></div>
              </div>

              <h3 className="panel-title mt-4 mb-3">Risk trend</h3>
              <div className="risk-chart">
                {recentPredictions.length ? recentPredictions.map((item) => (
                  <div className="risk-column" key={item._id}>
                    <div className="risk-bar-vertical" style={{ height: `${Math.max(8, (item.riskPercentage / riskMax) * 100)}%` }} />
                    <small>{item.assessmentType}</small>
                  </div>
                )) : <p className="muted-copy mb-0">Run an assessment to see your risk trend.</p>}
              </div>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Assessment history</h2>
              <div className="history-list">
                {history.predictions?.length ? history.predictions.map((item) => (
                  <div className="history-row" key={item._id}>
                    <div><strong>{item.assessmentType.toUpperCase()}</strong><div className="muted-copy">{new Date(item.createdAt).toLocaleString()}</div></div>
                    <span className={`status-pill status-${item.riskLevel.toLowerCase()}`}>{item.riskLevel}</span>
                    <div>{item.riskPercentage}%</div>
                  </div>
                )) : <p className="muted-copy mb-0">No assessments saved yet.</p>}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="panel-card">
              <h2 className="panel-title mb-3">Quick actions</h2>
              <div className="d-grid gap-2">
                <Link className="btn btn-primary rounded-pill" to="/profile">Update profile</Link>
                <Link className="btn btn-outline-primary rounded-pill" to="/appointments">Book appointment</Link>
                <Link className="btn btn-outline-primary rounded-pill" to="/prediction">Run assessment</Link>
              </div>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Notifications</h2>
              <div className="notification-list">
                {notifications?.length ? notifications.map((item) => (
                  <button key={item._id} className={`notification-item ${item.isRead ? "is-read" : ""}`} onClick={() => markRead(item._id)}>
                    <strong>{item.title}</strong><span>{item.message}</span>
                  </button>
                )) : <p className="muted-copy mb-0">You are all caught up.</p>}
              </div>
            </div>

            <div className="panel-card mt-4">
              <h2 className="panel-title mb-3">Upcoming appointments</h2>
              {(dashboard?.upcomingAppointments || []).length ? dashboard.upcomingAppointments.map((item) => (
                <div className="history-row align-items-start" key={item._id}>
                  <div><strong>{item.concern}</strong><div className="muted-copy">{new Date(item.appointmentDate).toLocaleString()}</div></div>
                  <span className={`status-pill status-${item.status}`}>{item.status}</span>
                </div>
              )) : <p className="muted-copy mb-0">No upcoming appointments.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
