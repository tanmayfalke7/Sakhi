import { useState } from "react";
import { Mail } from "lucide-react";
import platformService from "../../services/platformService";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const form = event.target;
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setError("Please fill out every field.");
      setLoading(false);
      return;
    }

    try {
      const response = await platformService.submitContact(payload);
      setMessage(response.message || "Thank you for contacting Sakhi. We will get back to you soon.");
      form.reset();
    } catch (err) {
      setError(err.message || "Unable to send your message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-center">
          <span className="section-badge">Contact us</span>
          <h1>Reach the Sakhi care team</h1>
          <p>Send a message without logging in. We will review it and respond as soon as possible.</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="panel-card">
              <div className="panel-heading">
                <Mail className="text-primary" />
                <div><h2 className="panel-title">Contact form</h2><p className="panel-subtitle">All fields are required.</p></div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6"><label>Name</label><input name="name" className="form-control" required /></div>
                  <div className="col-md-6"><label>Email</label><input name="email" type="email" className="form-control" required /></div>
                  <div className="col-12"><label>Subject</label><input name="subject" className="form-control" required /></div>
                  <div className="col-12"><label>Message</label><textarea name="message" className="form-control" rows="5" minLength="10" required /></div>
                </div>
                {message && <div className="alert alert-success mt-3">{message}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                <button className="btn btn-primary mt-3" disabled={loading}>{loading ? "Sending..." : "Send message"}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
