import { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import platformService from "../../services/platformService";

const toNumberOrUndefined = (value) => (value === "" ? undefined : Number(value));

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await platformService.getProfile();
        setProfile(response.data);
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = event.target;

    try {
      const response = await platformService.updateProfile({
        name: form.name.value,
        phone: form.phone.value,
        profile: {
          age: toNumberOrUndefined(form.age.value),
          heightCm: toNumberOrUndefined(form.heightCm.value),
          weightKg: toNumberOrUndefined(form.weightKg.value),
          waistCm: toNumberOrUndefined(form.waistCm.value),
          hipCm: toNumberOrUndefined(form.hipCm.value),
          cycleLength: toNumberOrUndefined(form.cycleLength.value),
          sleepHours: toNumberOrUndefined(form.sleepHours.value),
          city: form.city.value,
          cycleRegularity: form.cycleRegularity.value,
          lifestyle: form.lifestyle.value,
          symptoms: form.symptoms.value,
        },
      });
      setProfile(response.data);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    }
  };

  if (loading) {
    return <section className="page-shell"><div className="container py-5">Loading profile...</div></section>;
  }

  const health = profile?.profile || {};

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Health profile</span>
          <h1>Your profile</h1>
          <p>Keep your health details updated so assessments and consultations start with better context.</p>
        </div>

        <div className="panel-card">
          <div className="panel-heading">
            <HeartPulse className="text-primary" />
            <div>
              <h2 className="panel-title">Patient health information</h2>
              <p className="panel-subtitle">These values also prefill your assessment forms.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><label>Name</label><input name="name" defaultValue={profile?.name || ""} className="form-control" required /></div>
              <div className="col-md-6"><label>Phone</label><input name="phone" defaultValue={profile?.phone || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Age</label><input name="age" type="number" defaultValue={health.age || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Height (cm)</label><input name="heightCm" type="number" defaultValue={health.heightCm || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Weight (kg)</label><input name="weightKg" type="number" defaultValue={health.weightKg || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Sleep hours</label><input name="sleepHours" type="number" step="0.5" defaultValue={health.sleepHours || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Waist (cm)</label><input name="waistCm" type="number" defaultValue={health.waistCm || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Hip (cm)</label><input name="hipCm" type="number" defaultValue={health.hipCm || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Cycle length</label><input name="cycleLength" type="number" defaultValue={health.cycleLength || ""} className="form-control" /></div>
              <div className="col-md-3"><label>Cycle regularity</label><select name="cycleRegularity" defaultValue={health.cycleRegularity || ""} className="form-select"><option value="">Select</option><option value="regular">Regular</option><option value="irregular">Irregular</option></select></div>
              <div className="col-md-6"><label>City</label><input name="city" defaultValue={health.city || ""} className="form-control" /></div>
              <div className="col-md-6"><label>Lifestyle notes</label><input name="lifestyle" defaultValue={health.lifestyle || ""} className="form-control" /></div>
              <div className="col-12"><label>Symptoms</label><textarea name="symptoms" defaultValue={health.symptoms || ""} className="form-control" rows="3" /></div>
            </div>
            {message && <div className="alert alert-success mt-3">{message}</div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <button className="btn btn-primary mt-3">Save profile</button>
          </form>
        </div>
      </div>
    </section>
  );
}
