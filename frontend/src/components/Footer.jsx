import React, { useEffect, useState } from "react";
import { Heart, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import authService from "../services/authService";

export default function Footer() {
  const [user, setUser] = useState(authService.getStoredUser());

  useEffect(() => {
    const syncUser = () => setUser(authService.getStoredUser());
    window.addEventListener("sakhi-auth-changed", syncUser);
    return () => window.removeEventListener("sakhi-auth-changed", syncUser);
  }, []);

  return (
    <footer className="footer-section pt-5 mt-5">
      <div className="container">
        <div className="row pb-4 border-bottom">
          <div className="col-md-4 mb-4">
            <Logo />
            <p className="text-muted mt-3">
              Your trusted companion for PCOS awareness, early screening, guided care, and a safe
              support system.
            </p>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="fw-semibold mb-3">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about-pcos">About PCOS</Link></li>
              <li>
                <Link to={user?.role === "patient" ? "/prediction" : "/signup"}>
                  {user?.role === "patient" ? "Assessment Tools" : "Create Account"}
                </Link>
              </li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="fw-semibold mb-3">Connect With Us</h5>
            <div className="d-flex gap-3">
              <a href="#" className="social-circle">
                <Instagram size={18} />
              </a>
              <a href="#" className="social-circle">
                <Facebook size={18} />
              </a>
              <a href="#" className="social-circle">
                <Twitter size={18} />
              </a>
              <a href="#" className="social-circle">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-muted d-flex align-items-center justify-content-center gap-2 mb-2">
            Made with
            <Heart size={16} className="footer-heart" fill="#F9D7E6" />
            for women's health
          </p>

          <p className="text-muted small mb-0">(c) 2026 Sakhi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
