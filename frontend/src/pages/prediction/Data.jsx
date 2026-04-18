// import React, { useState } from "react";
// import axios from "axios";
// import { Activity, AlertCircle, Heart, TrendingUp } from "lucide-react";

// export default function Data() {
//   const [risk, setRisk] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const form = e.target;

//     // Map frontend inputs to backend keys
//     const data = {
//       age: form.age.value,
//       weight: form.weight.value,
//       height: form.height.value,
//       waist: form.waist.value,
//       hip: form.hip.value,
//       cycle_length: form.cycle_length.value,
//       cycle: form.cycle.value,
//       weight_gain: form.weight_gain.value,
//       hair_growth: form.hair_growth.value,
//       hair_loss: form.hair_loss.value,
//       pimples: form.pimples.value,
//       skin_darkening: form.skin_darkening.value || "No",
//       fast_food: form.fast_food.value,
//       exercise: form.exercise.value,
//     };

//     try {
//   const response = await axios.post("http://127.0.0.1:8000/api/v1/predict/pcos", data);
//   setRisk(response.data.risk);   // ✅ FIX
// } catch (err) {
//   console.error(err);
//   alert("Error predicting PCOS risk. Make sure your backend is running.");
// }

//     setLoading(false);
//   };

//   // Render Yes/No radios
//   const renderYesNo = (label, name) => (
//     <div className="col-md-6 mb-3">
//       <label className="form-label d-block">{label}</label>
//       <div className="form-check form-check-inline">
//         <input type="radio" name={name} value="Yes" defaultChecked className="form-check-input" />
//         <label className="form-check-label">Yes</label>
//       </div>
//       <div className="form-check form-check-inline">
//         <input type="radio" name={name} value="No" className="form-check-input" />
//         <label className="form-check-label">No</label>
//       </div>
//     </div>
//   );

//   return (
//     <div className="py-5" style={{ backgroundColor: "#f9f6fb", minHeight: "100vh" }}>
//       <div className="container d-flex justify-content-center">
//         <div style={{ maxWidth: "850px", width: "100%" }}>
//           <div className="text-center mb-5">
//             <div className="d-inline-flex align-items-center px-4 py-2 rounded-pill mb-3"
//                  style={{ backgroundColor: "#f3e8f7", color: "#b57edc", fontWeight: "500" }}>
//               <Activity size={18} className="me-2" /> AI-Powered Assessment
//             </div>
//             <h1 className="fw-bold mb-3">PCOS Risk Prediction</h1>
//             <p className="text-muted">
//               Answer the questions below to receive a personalized PCOS risk assessment
//             </p>
//           </div>

//           <div className="card border-0 p-4 p-md-5"
//                style={{ borderRadius: "20px", boxShadow: "0 10px 40px rgba(200, 162, 200, 0.15)" }}>
//             <form onSubmit={handleSubmit}>
//               {/* Physical Info */}
//               <h4 className="mb-4"><Heart size={20} className="me-2 text-secondary" /> Physical Information</h4>
//               <div className="row mb-4">
//                 <div className="col-md-6 mb-3">
//                   <label className="form-label">Age (yrs)</label>
//                   <input name="age" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//                 <div className="col-md-6 mb-3">
//                   <label className="form-label">Weight (kg)</label>
//                   <input name="weight" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//                 <div className="col-md-6 mb-3">
//                   <label className="form-label">Height (cm)</label>
//                   <input name="height" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//                 <div className="col-md-6 mb-3">
//                   <label className="form-label">Waist (inch)</label>
//                   <input name="waist" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//                 <div className="col-md-6 mb-3">
//                   <label className="form-label">Hip (inch)</label>
//                   <input name="hip" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//               </div>

//               {/* Menstrual */}
//               <h4 className="mb-4 mt-4"><Activity size={20} className="me-2 text-secondary" /> Menstrual Cycle Information</h4>
//               <div className="row mb-4">
//                 <div className="col-md-6 mb-3">
//                   <label>Average Cycle Length (days)</label>
//                   <input name="cycle_length" type="number" className="form-control rounded-pill py-2" required />
//                 </div>
//                 <div className="col-md-6 mb-3">
//                   <label>Regular Cycles?</label>
//                   <select name="cycle" className="form-select rounded-pill py-2" required>
//                     <option>Yes</option>
//                     <option>No</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Symptoms */}
//               <h4 className="mb-4 mt-4"><AlertCircle size={20} className="me-2 text-secondary" /> Symptoms</h4>
//               <div className="row mb-4">
//                 {renderYesNo("Recent Weight Gain?", "weight_gain")}
//                 {renderYesNo("Excess Hair Growth?", "hair_growth")}
//                 {renderYesNo("Hair Loss?", "hair_loss")}
//                 {renderYesNo("Acne?", "pimples")}
//                 {renderYesNo("Skin Darkening?", "skin_darkening")}
//               </div>

//               {/* Lifestyle */}
//               <h4 className="mb-4 mt-4"><TrendingUp size={20} className="me-2 text-secondary" /> Lifestyle</h4>
//               <div className="row mb-4">
//                 {renderYesNo("Regular Fast Food Consumption?", "fast_food")}
//                 {renderYesNo("Regular Exercise?", "exercise")}
//               </div>

//               <button type="submit" className="btn btn-primary w-100 rounded-pill py-3 mt-3">
//                 {loading ? "Calculating..." : "Predict PCOS Risk"}
//               </button>

//               {risk && <div className="mt-4 alert alert-info text-center fw-bold">PCOS Risk: {risk}</div>}

//               <p className="text-center text-muted mt-3 small">
//                 This tool provides an estimate only. Please consult a healthcare provider for accurate diagnosis.
//               </p>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import axios from "axios";
import { Activity, AlertCircle, Heart, TrendingUp } from "lucide-react";

export default function Data() {

  const [risk, setRisk] = useState(null);
  const [riskLevel, setRiskLevel] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);

    const form = e.target;

    const data = {
      age: form.age.value,
      weight: form.weight.value,
      height: form.height.value,
      waist: form.waist.value,
      hip: form.hip.value,
      cycle_length: form.cycle_length.value,
      cycle: form.cycle.value,
      weight_gain: form.weight_gain.value,
      hair_growth: form.hair_growth.value,
      hair_loss: form.hair_loss.value,
      pimples: form.pimples.value,
      skin_darkening: form.skin_darkening.value || "No",
      fast_food: form.fast_food.value,
      exercise: form.exercise.value
    };

    try {

      const response = await axios.post("http://127.0.0.1:8000/api/v1/predict/pcos", data);
      setRisk(response.data.risk);
      setRiskLevel(response.data.level);
      setRecommendation(response.data.recommendation);

    } catch (err) {
      console.error(err);
      alert("Error predicting PCOS risk. Make sure backend is running.");
    }

    setLoading(false);
  };

  const renderYesNo = (label, name) => (
    <div className="col-md-6 mb-3">
      <label className="form-label d-block">{label}</label>

      <div className="form-check form-check-inline">
        <input type="radio" name={name} value="Yes" defaultChecked className="form-check-input"/>
        <label className="form-check-label">Yes</label>
      </div>

      <div className="form-check form-check-inline">
        <input type="radio" name={name} value="No" className="form-check-input"/>
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
    <div className="py-5" style={{ backgroundColor:"#f9f6fb", minHeight:"100vh"}}>

      <div className="container d-flex justify-content-center">
        <div style={{maxWidth:"850px", width:"100%"}}>

          <div className="text-center mb-5">
            <div className="d-inline-flex align-items-center px-4 py-2 rounded-pill mb-3"
              style={{backgroundColor:"#f3e8f7", color:"#b57edc"}}>
              <Activity size={18} className="me-2"/> AI-Powered Assessment
            </div>

            <h1 className="fw-bold">PCOS Risk Prediction</h1>
            <p className="text-muted">
              Answer questions to receive a personalized PCOS risk assessment
            </p>
          </div>

          <div className="card p-4 p-md-5" style={{borderRadius:"20px"}}>

            <form onSubmit={handleSubmit}>

              <h4 className="mb-4"><Heart size={20} className="me-2"/>Physical Information</h4>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Age</label>
                  <input name="age" type="number" className="form-control" required/>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Weight (kg)</label>
                  <input name="weight" type="number" className="form-control" required/>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Height (cm)</label>
                  <input name="height" type="number" className="form-control" required/>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Waist</label>
                  <input name="waist" type="number" className="form-control" required/>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Hip</label>
                  <input name="hip" type="number" className="form-control" required/>
                </div>
              </div>

              <h4 className="mt-4 mb-3"><Activity size={20} className="me-2"/>Menstrual Cycle</h4>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Cycle Length</label>
                  <input name="cycle_length" type="number" className="form-control" required/>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Regular Cycles?</label>
                  <select name="cycle" className="form-select">
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

              <button className="btn btn-primary w-100 mt-3">
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

        </div>
      </div>

    </div>
  );
}