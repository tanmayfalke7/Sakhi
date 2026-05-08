import React from 'react';
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import Prediction from "./pages/prediction/Prediction";
import Footer from "./components/Footer";
import Login from "./pages/login/LoginPage";
import Signup from "./pages/signup/SignupPage";
import ContactPage from "./pages/contact/ContactPage";
import PortalPage from "./pages/portal/PortalPage";
import CommunityPage from "./pages/community/CommunityPage";
import DoctorLoginPage from "./pages/doctor/DoctorLoginPage";
import DoctorDashboardPage from "./pages/doctor/DoctorDashboardPage";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import ChatWidget from './components/Chatbot/ChatWidget';
import authService from "./services/authService";

export default function App() {
  const [user, setUser] = useState(authService.getStoredUser());

  useEffect(() => {
    const syncUser = () => setUser(authService.getStoredUser());
    window.addEventListener("sakhi-auth-changed", syncUser);
    return () => window.removeEventListener("sakhi-auth-changed", syncUser);
  }, []);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-pcos" element={<AboutPage/>} />
        <Route
          path="/prediction"
          element={
            <ProtectedRoute requiredRole="patient">
              <Prediction/>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/contact" element={<ContactPage/>} />
        <Route
          path="/portal"
          element={
            <ProtectedRoute requiredRole="patient">
              <PortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route path="/doctor/login" element={<DoctorLoginPage />} />
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer/>

      {user?.role === "patient" && <ChatWidget />}
    </>
  );
}
