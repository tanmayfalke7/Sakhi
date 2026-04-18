import { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./LoginPage.css";

export default function LoginPage() {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Call login API
      const response = await authService.loginUser(formData.email, formData.password);

      if (response.success) {
        setSuccess("Login successful! Redirecting...");
        
        // Reset form
        setFormData({ email: "", password: "" });
        
        // Redirect to homepage after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section py-5">

      <div className="container py-5">

        <div className="row align-items-center">

          {/* LEFT SIDE */}
          <div className="col-lg-6 text-center p-4">

            <div className="login-image-card">

              <img
                src="https://img.freepik.com/premium-vector/mental-health-concept-woman-with-mind-healthy-icons-illustration-design_24877-66811.jpg"
                alt="login"
                className="img-fluid rounded-4"
              />

            </div>

            <h3 className="mt-4 fw-bold">Welcome Back!</h3>

            <p className="text-muted">
              Continue your journey towards better health with Sakhi
            </p>

          </div>


          {/* RIGHT SIDE */}
          <div className="col-lg-6 p-4">

            <div className="login-card">

              <h2 className="fw-bold mb-2">Login to Sakhi</h2>

              <p className="text-muted mb-4">
                Enter your credentials to access your account
              </p>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
              )}

              {/* SUCCESS MESSAGE */}
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* EMAIL */}
                <div className="mb-3">

                  <label className="form-label">Email Address</label>

                  <div className="input-group custom-input">

                    <span className="input-group-text">
                      <Mail size={18}/>
                    </span>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>


                {/* PASSWORD */}
                <div className="mb-3">

                  <label className="form-label">Password</label>

                  <div className="input-group custom-input">

                    <span className="input-group-text">
                      <Lock size={18}/>
                    </span>

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />

                    <button
                      type="button"
                      className="btn eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>

                  </div>

                </div>


                {/* REMEMBER */}
                <div className="d-flex justify-content-between align-items-center mb-4">

                  <div className="form-check">

                    <input
                      type="checkbox"
                      className="form-check-input"
                    />

                    <label className="form-check-label">
                      Remember me
                    </label>

                  </div>

                  <a href="#" className="forgot-link">
                    Forgot password?
                  </a>

                </div>


                {/* LOGIN BUTTON */}
                <button 
                  className="btn login-btn w-100" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

              </form>


              {/* SIGNUP */}
              <p className="text-center mt-4">

                Don't have an account?{" "}

                <Link to="/signup" className="signup-link">
                  Sign up
                </Link>

              </p>


              {/* TERMS */}
              <p className="text-center small text-muted mt-3">

                By logging in, you agree to our{" "}

                <a href="#">Terms of Service</a> and{" "}

                <a href="#">Privacy Policy</a>

              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}