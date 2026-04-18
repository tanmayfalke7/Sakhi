import React from 'react';

import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import Prediction from "./pages/prediction/Prediction";
import Footer from "./components/Footer";
import Login from "./pages/login/LoginPage";
import Signup from "./pages/signup/SignupPage";
import ChatWidget from './components/Chatbot/ChatWidget';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-pcos" element={<AboutPage/>} />
        <Route path="/prediction" element={<Prediction/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
      </Routes>
      <Footer/>
      
      {/* Placing ChatWidget outside of Routes ensures the floating 
        button is always visible across every page of your app! 
      */}
      <ChatWidget />
    </>
  );
}