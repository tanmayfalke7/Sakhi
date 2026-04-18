import React from "react";
import { Heart, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="footer-section pt-5 mt-5">
      <div className="container">

        <div className="row pb-4 border-bottom">

          {/* Logo + Text */}
          <div className="col-md-4 mb-4">
            <Logo />
            <p className="text-muted mt-3">
              Your trusted companion for PCOS awareness,
              prediction, and support.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-4">
            <h5 className="fw-semibold mb-3">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about-pcos">About PCOS</a></li>
              <li><a href="/prediction">Prediction Tool</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          {/* Social Icons */}
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

        {/* Bottom Section */}
        <div className="text-center py-4">
          <p className="text-muted d-flex align-items-center justify-content-center gap-2 mb-2">
            Made with 
            <Heart 
              size={16} 
              className="footer-heart"
              fill="#F9D7E6"
            /> 
            for women's health
          </p>

          <p className="text-muted small mb-0">
            © 2026 Sakhi. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
