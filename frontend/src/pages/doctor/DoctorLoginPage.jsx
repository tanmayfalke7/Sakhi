import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.loginUser(email, password);
      if (response.data?.role !== "doctor") {
        throw new Error("This portal is reserved for the doctor account.");
      }
      navigate("/doctor/dashboard");
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Doctor login failed.");
    }
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="panel-card">
              <span className="section-badge">Single-doctor admin</span>
              <h1 className="panel-title mt-3">Doctor portal</h1>
              <p className="panel-subtitle">Use the fixed Sakhi doctor credentials to manage appointments, notes, and community moderation.</p>

              <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
                <label>Password</label>
                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                <button className="btn btn-primary mt-3 w-100">Enter doctor dashboard</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
