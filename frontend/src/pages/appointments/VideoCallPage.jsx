import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react";
import authService from "../../services/authService";
import platformService from "../../services/platformService";

export default function VideoCallPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const start = async () => {
      try {
        const response = await platformService.startAppointmentCall(id);
        setAppointment(response.data);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(err.message || "Unable to join this video consultation.");
      }
    };

    start();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [id]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const response = await platformService.getAppointments();
        const latest = response.data.find((item) => item._id === id);
        if (latest) setAppointment(latest);
        if (latest?.callEndedAt || latest?.status === "completed") {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          navigate(user?.role === "doctor" ? "/doctor/appointments" : "/appointments");
        }
      } catch {
        // Keep the local call UI alive during transient polling errors.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [id, navigate, user?.role]);

  const toggleAudio = () => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted((value) => !value);
  };

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });
    setCameraOff((value) => !value);
  };

  const endCall = async () => {
    if (user?.role !== "doctor") return;
    await platformService.endAppointmentCall(id);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    navigate("/doctor/appointments");
  };

  return (
    <section className="page-shell video-call-shell">
      <div className="container py-5">
        <div className="page-hero text-start">
          <span className="section-badge">Online consultation</span>
          <h1>{appointment?.concern || "Video call"}</h1>
          <p>Room: {appointment?.callRoomId || id}</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="video-grid">
          <div className="video-tile">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
          <div className="video-tile remote-placeholder">
            <div>{user?.role === "doctor" ? appointment?.patient?.name : appointment?.doctor?.name}</div>
            <small>Participant video appears here when connected through the room.</small>
          </div>
        </div>
        <div className="call-controls">
          <button className="btn btn-outline-primary rounded-pill" onClick={toggleAudio}>{muted ? <MicOff /> : <Mic />} {muted ? "Unmute" : "Mute"}</button>
          <button className="btn btn-outline-primary rounded-pill" onClick={toggleCamera}>{cameraOff ? <CameraOff /> : <Camera />} {cameraOff ? "Camera on" : "Camera off"}</button>
          {user?.role === "doctor" ? (
            <button className="btn btn-danger rounded-pill" onClick={endCall}><PhoneOff /> End call</button>
          ) : (
            <button className="btn btn-outline-primary rounded-pill" onClick={() => navigate("/appointments")}>Leave</button>
          )}
        </div>
      </div>
    </section>
  );
}
