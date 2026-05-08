import { Navigate } from "react-router-dom";
import authService from "../../services/authService";

export default function ProtectedRoute({ children, requiredRole }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getStoredUser();

  if (!isAuthenticated || !user) {
    return <Navigate to={requiredRole === "doctor" ? "/doctor/login" : "/login"} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "doctor" ? "/doctor/dashboard" : "/portal"} replace />;
  }

  return children;
}
