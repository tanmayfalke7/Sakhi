import React, { useEffect, useState } from "react";
import { Activity, AlertCircle, Heart, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import platformService from "../../services/platformService";

export default function Data() {
  const [risk, setRisk] = useState(null);
  const [riskLevel, setRiskLevel] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    age: "", weight: "", height: "", waist: "", hip: "", cycle_length: "", cycle: "Yes",
    weight_gain: "Yes", hair_growth: "No", hair_loss: "No", pimples: "No", skin_darkening: "No",
    fast_food: "No", exercise: "Yes",
  });
  const navigate = useNavigate();

  useEffect(() => {
    platformService.getProfile().then((response) => {
      const profile = response.data?.profile || {};
      setFormData((current) => ({
        ...current,
        age: profile.age || "",
        weight: profile.weightKg || "",
        height: profile.heightCm || "",
        waist: profile.waistCm || "",
        hip: profile.hipCm || "",
        cycle_length: profile.cycleLength || "",
        cycle: profile.cycleRegularity === "irregular" ? "No" : "Yes",
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
      const response = await platformService.submitPcosPrediction(data);
      setRisk(response.data.riskPercentage);
      setRiskLevel(response.data.riskLevel);
      setRecommendation(response.data.recommendation);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not complete prediction right now.");
    }

    setLoading(false);
  };

  const renderYesNo = (label, name) => (
    <div className="col-md-6 mb-3">
      <label className="form-label d-block">{label}</label>

      <div className="form-check form-check-inline">
        <input type="radio" name={name} value="Yes" checked={formData[name] === "Yes"} onChange={updateField} className="form-check-input"/>
        <label className="form-check-label">Yes</label>
      </div>

      <div className="form-check form-check-inline">
        <input type="radio" name={name} value="No" checked={formData[name] === "No"} onChange={updateField} className="form-check-input"/>
        <label className="form-check-label">No</label>
      </div>
    </div>
  );

  const getColor = () => {
    if (riskLevel === "Low") return "#e6f9f0";
    if (riskLevel === "Moderate") return "#fff4e6";
    return "#fdecea";
  };

  const getTextColor = () => {
    if (riskLevel === "Low") return "#2e7d32";
    if (riskLevel === "Moderate") return "#e65100";
    return "#c62828";
  };

  return (
    <div className="panel-card h-100">
      <div className="d-inline-flex align-items-center px-4 py-2 rounded-pill mb-3 sakhi-soft-pill">
        <Activity size={18} className="me-2"/> PCOS assessment
      </div>

      <div className="mb-4">
        <h2 className="panel-title">PCOS risk prediction</h2>
        <p className="panel-subtitle">
          Answer a few symptom and lifestyle questions to receive a stored screening summary.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <h4 className="mb-4"><Heart size={20} className="me-2"/>Physical Information</h4>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Age</label>
            <input name="age" type="number" value={formData.age} onChange={updateField} className="form-control" required/>
          </div>

          <div className="col-md-6 mb-3">
            <label>Weight (kg)</label>
            <input name="weight" type="number" value={formData.weight} onChange={updateField} className="form-control" required/>
          </div>

          <div className="col-md-6 mb-3">
            <label>Height (cm)</label>
            <input name="height" type="number" value={formData.height} onChange={updateField} className="form-control" required/>
          </div>

          <div className="col-md-6 mb-3">
            <label>Waist</label>
            <input name="waist" type="number" value={formData.waist} onChange={updateField} className="form-control" required/>
          </div>

          <div className="col-md-6 mb-3">
            <label>Hip</label>
            <input name="hip" type="number" value={formData.hip} onChange={updateField} className="form-control" required/>
          </div>
        </div>

        <h4 className="mt-4 mb-3"><Activity size={20} className="me-2"/>Menstrual Cycle</h4>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Cycle Length</label>
            <input name="cycle_length" type="number" value={formData.cycle_length} onChange={updateField} className="form-control" required/>
          </div>

          <div className="col-md-6 mb-3">
            <label>Regular Cycles?</label>
            <select name="cycle" value={formData.cycle} onChange={updateField} className="form-select">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <h4 className="mt-4 mb-3"><AlertCircle size={20} className="me-2"/>Symptoms</h4>

        <div className="row">
          {renderYesNo("Weight Gain", "weight_gain")}
          {renderYesNo("Hair Growth", "hair_growth")}
          {renderYesNo("Hair Loss", "hair_loss")}
          {renderYesNo("Acne", "pimples")}
          {renderYesNo("Skin Darkening", "skin_darkening")}
        </div>

        <h4 className="mt-4 mb-3"><TrendingUp size={20} className="me-2"/>Lifestyle</h4>

        <div className="row">
          {renderYesNo("Fast Food", "fast_food")}
          {renderYesNo("Exercise", "exercise")}
        </div>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <button className="btn btn-primary w-100 mt-3" type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Predict PCOS Risk"}
        </button>
      </form>

      {risk !== null && (
        <div
          className="mt-4 p-4 text-center"
          style={{
            borderRadius:"15px",
            backgroundColor:getColor(),
            color:getTextColor()
          }}
        >
          <h4>PCOS Risk Assessment</h4>
          <p>Risk Percentage: {risk}%</p>
          <p>Risk Level: {riskLevel}</p>
          <p style={{fontWeight:"500"}}>
            Recommendation: {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
