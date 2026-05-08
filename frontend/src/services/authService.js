import API from "./api";

const notifyAuthChange = () => {
  window.dispatchEvent(new Event("sakhi-auth-changed"));
};

const persistSession = (payload) => {
  if (payload?.token) {
    localStorage.setItem("token", payload.token);
  }
  if (payload?.data) {
    localStorage.setItem("sakhi-user", JSON.stringify(payload.data));
  }
  notifyAuthChange();
};

const authService = {
  registerUser: async (name, email, password) => {
    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password,
      });
      persistSession(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  loginUser: async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });
      persistSession(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },

  logoutUser: async () => {
    try {
      if (localStorage.getItem("token")) {
        await API.post("/auth/logout");
      }
    } catch {
      // Swallow logout request failures and clear the session anyway.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("sakhi-user");
      notifyAuthChange();
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await API.get("/auth/me");
      if (response.data?.data) {
        localStorage.setItem("sakhi-user", JSON.stringify(response.data.data));
        notifyAuthChange();
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch user" };
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getStoredUser: () => {
    const value = localStorage.getItem("sakhi-user");
    return value ? JSON.parse(value) : null;
  },

  isDoctor: () => {
    return authService.getStoredUser()?.role === "doctor";
  },
};

export default authService;
