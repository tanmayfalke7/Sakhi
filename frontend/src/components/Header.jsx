import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import authService from "../services/authService";
import platformService from "../services/platformService";

export function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(authService.getStoredUser());
    window.addEventListener("sakhi-auth-changed", syncUser);
    return () => window.removeEventListener("sakhi-auth-changed", syncUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    platformService.getNotifications()
      .then((response) => setNotifications(response.data || []))
      .catch(() => setNotifications([]));
  }, [user]);

  const handleLogout = async () => {
    await authService.logoutUser();
    navigate("/");
  };

  const markRead = async (id) => {
    await platformService.markNotificationRead(id);
    const response = await platformService.getNotifications();
    setNotifications(response.data || []);
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <nav className="navbar navbar-expand-lg sakhi-navbar sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <Logo />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/about-pcos">
                About PCOS
              </NavLink>
            </li>

            {user?.role === "patient" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/prediction">
                  Assessments
                </NavLink>
              </li>
            )}

            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">
                Contact
              </NavLink>
            </li>

            {user?.role === "patient" && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/portal">
                    My Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">
                    Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/appointments">
                    Appointments
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/community">
                    Community
                  </NavLink>
                </li>
              </>
            )}

            {user?.role === "doctor" && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctor/dashboard">
                    Doctor Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctor/appointments">
                    Appointments
                  </NavLink>
                </li>
              </>
            )}

            {user && (
              <li className="nav-item notification-nav">
                <button className="notification-trigger" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Notifications">
                  <Bell size={18} />
                  {unreadCount > 0 && <span>{unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-menu">
                    {notifications.length ? notifications.slice(0, 5).map((item) => (
                      <button key={item._id} className={`notification-item ${item.isRead ? "is-read" : ""}`} onClick={() => markRead(item._id)}>
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                      </button>
                    )) : <p className="muted-copy mb-0 p-3">You are all caught up.</p>}
                  </div>
                )}
              </li>
            )}

            {!user ? (
              <>
                <li className="nav-item">
                  <NavLink className="btn btn-outline-primary rounded-pill px-4" to="/signup">
                    Sign Up
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-primary rounded-pill px-4" to="/login">
                    Login
                  </NavLink>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button className="btn btn-primary rounded-pill px-4" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
