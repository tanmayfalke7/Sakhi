import API from "./api";

const platformService = {
  getPatientDashboard: async () => (await API.get("/users/dashboard")).data,
  getProfile: async () => (await API.get("/users/profile")).data,
  updateProfile: async (payload) => (await API.put("/users/profile", payload)).data,
  getHistory: async () => (await API.get("/users/history")).data,
  getNotifications: async () => (await API.get("/users/notifications")).data,
  markNotificationRead: async (id) => (await API.patch(`/users/notifications/${id}/read`)).data,
  getPredictions: async () => (await API.get("/predictions/mine")).data,
  submitPcosPrediction: async (payload) => (await API.post("/predictions/pcos", payload)).data,
  submitThyroidPrediction: async (payload) => (await API.post("/predictions/thyroid", payload)).data,
  getAppointments: async () => (await API.get("/appointments")).data,
  bookAppointment: async (payload) => (await API.post("/appointments", payload)).data,
  cancelAppointment: async (id) => (await API.patch(`/appointments/${id}/cancel`)).data,
  startAppointmentCall: async (id) => (await API.post(`/appointments/${id}/call/start`)).data,
  endAppointmentCall: async (id) => (await API.post(`/appointments/${id}/call/end`)).data,
  updateAppointmentStatus: async (id, payload) =>
    (await API.patch(`/appointments/${id}/status`, payload)).data,
  getCommunityPosts: async () => (await API.get("/community/posts")).data,
  createCommunityPost: async (payload) => (await API.post("/community/posts", payload)).data,
  toggleCommunityLike: async (id) => (await API.patch(`/community/posts/${id}/like`)).data,
  deleteCommunityPost: async (id, reason) =>
    (await API.delete(`/community/posts/${id}`, { data: { reason } })).data,
  getDoctorDashboard: async () => (await API.get("/doctor/dashboard")).data,
  getDoctorPatients: async () => (await API.get("/doctor/patients")).data,
  getDoctorPatientDetails: async (id) => (await API.get(`/doctor/patients/${id}`)).data,
  getDoctorNotes: async (patientId) =>
    (await API.get("/doctor/notes", { params: patientId ? { patientId } : undefined })).data,
  createDoctorNote: async (payload) => (await API.post("/doctor/notes", payload)).data,
  submitContact: async (payload) => (await API.post("/contact", payload)).data,
};

export default platformService;
