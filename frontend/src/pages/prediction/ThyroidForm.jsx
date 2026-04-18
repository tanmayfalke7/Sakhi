import React, { useState } from "react"
import axios from "axios"
import "./ThyroidForm.css"

export default function ThyroidForm(){

const [risk,setRisk]=useState(null)
const [level,setLevel]=useState("")
const [rec,setRec]=useState("")

const handleSubmit = async (e) => {

e.preventDefault()

const form = e.target

const data = {
weight: form.weight.value,
height: form.height.value,
sleep: form.sleep.value,
fatigue: form.fatigue.value,
dry_skin: form.dry_skin.value,
cold: form.cold.value,
heat: form.heat.value,
hair_loss: form.hair_loss.value,
weight_gain: form.weight_gain.value
}

try{

const res = await axios.post(
"http://127.0.0.1:8000/api/v1/predict/thyroid",
data
)

setRisk(res.data.risk)
setLevel(res.data.level)
setRec(res.data.recommendation)

}catch(err){

console.error("Prediction Error:",err)

}

}

return(

<div className="card p-4 mt-5">

<h2>Thyroid Risk Prediction</h2>

<form onSubmit={handleSubmit}>

<input name="weight" placeholder="Weight (kg)" className="form-control mb-2" required/>

<input name="height" placeholder="Height (cm)" className="form-control mb-2" required/>

<input name="sleep" placeholder="Sleep hours" className="form-control mb-2" required/>

<select name="fatigue" className="form-control mb-2">
<option value="1">Fatigue Yes</option>
<option value="0">Fatigue No</option>
</select>

<select name="dry_skin" className="form-control mb-2">
<option value="1">Dry Skin Yes</option>
<option value="0">Dry Skin No</option>
</select>

<select name="cold" className="form-control mb-2">
<option value="1">Cold Intolerance Yes</option>
<option value="0">No</option>
</select>

<select name="heat" className="form-control mb-2">
<option value="1">Heat Intolerance Yes</option>
<option value="0">No</option>
</select>

<select name="hair_loss" className="form-control mb-2">
<option value="1">Hair Loss Yes</option>
<option value="0">Hair Loss No</option>
</select>

<select name="weight_gain" className="form-control mb-2">
<option value="1">Weight Gain Yes</option>
<option value="0">Weight Gain No</option>
</select>

<button className="btn btn-primary mt-2">
Predict Thyroid Risk
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

)

}