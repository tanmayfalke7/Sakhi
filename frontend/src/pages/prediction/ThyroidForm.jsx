import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import authService from "../../services/authService";
import platformService from "../../services/platformService";
import "./ThyroidForm.css";

export default function ThyroidForm() {
  const [risk, setRisk] = useState(null);
  const [level, setLevel] = useState("");
  const [rec, setRec] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    weight: "", height: "", sleep: "", fatigue: "0", dry_skin: "0", cold: "0", heat: "0", hair_loss: "0", weight_gain: "0",
  });
  const navigate = useNavigate();

  useEffect(() => {
    platformService.getProfile().then((response) => {
      const profile = response.data?.profile || {};
      setFormData((current) => ({
        ...current,
        weight: profile.weightKg || "",
        height: profile.heightCm || "",
        sleep: profile.sleepHours || "",
      }));
    }).catch(() => {});
  }, []);

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    const data = { ...formData };

    try {
      const res = await platformService.submitThyroidPrediction(data);
      setRisk(res.data.riskPercentage);
      setLevel(res.data.riskLevel);
      setRec(res.data.recommendation);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to run thyroid prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-card h-100">
      <div className="d-inline-flex align-items-center px-4 py-2 rounded-pill mb-3 sakhi-soft-pill">
        <Sparkles size={18} className="me-2" /> Wellness check
      </div>

      <h2 className="panel-title">Thyroid risk companion</h2>
      <p className="panel-subtitle">
        Keep a secondary hormonal screening beside your PCOS assessment and store it in the same
        history timeline.
      </p>

      <form onSubmit={handleSubmit}>
        <input name="weight" value={formData.weight} onChange={updateField} placeholder="Weight (kg)" className="form-control mb-2" required />
        <input name="height" value={formData.height} onChange={updateField} placeholder="Height (cm)" className="form-control mb-2" required />
        <input name="sleep" value={formData.sleep} onChange={updateField} placeholder="Sleep hours" className="form-control mb-2" required />

        <select name="fatigue" value={formData.fatigue} onChange={updateField} className="form-control mb-2">
          <option value="1">Fatigue Yes</option>
          <option value="0">Fatigue No</option>
        </select>

        <select name="dry_skin" value={formData.dry_skin} onChange={updateField} className="form-control mb-2">
          <option value="1">Dry Skin Yes</option>
          <option value="0">Dry Skin No</option>
        </select>

        <select name="cold" value={formData.cold} onChange={updateField} className="form-control mb-2">
          <option value="1">Cold Intolerance Yes</option>
          <option value="0">No</option>
        </select>

        <select name="heat" value={formData.heat} onChange={updateField} className="form-control mb-2">
          <option value="1">Heat Intolerance Yes</option>
          <option value="0">No</option>
        </select>

        <select name="hair_loss" value={formData.hair_loss} onChange={updateField} className="form-control mb-2">
          <option value="1">Hair Loss Yes</option>
          <option value="0">Hair Loss No</option>
        </select>

        <select name="weight_gain" value={formData.weight_gain} onChange={updateField} className="form-control mb-2">
          <option value="1">Weight Gain Yes</option>
          <option value="0">Weight Gain No</option>
        </select>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <button className="btn btn-primary mt-2 w-100" type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict Thyroid Risk"}
        </button>
      </form>

      {risk !== null && (
        <div className="alert alert-info mt-3">
          <p><b>Risk:</b> {risk}%</p>
          <p><b>Level:</b> {level}</p>
          <p>{rec}</p>
        </div>
      )}
    </div>
  );
}
