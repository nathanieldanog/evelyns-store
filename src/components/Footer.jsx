import './Footer.css';
import { Link } from 'react-router';
import { ArrowUp, Mail, Phone, MapPin } from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaTiktok,
} from "react-icons/fa6";

import storeLogoV2 from '../assets/store-logo-v2.png';

function Footer() {
  return (
    <footer className="site-footer">

      <div className="footer-content">

        {/* LEFT */}
        <div className="footer-brand">

          <img
            src={storeLogoV2}
            alt="Evelyn's Store"
            className="footer-logo"
          />

          <p>
            Your one-stop online sari-sari store for groceries,
            snacks, beverages, and everyday essentials delivered
            right to your doorstep.
          </p>

          <div className="footer-socials">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaXTwitter /></a>
            <a href="#"><FaTiktok /></a>
          </div>

        </div>

        {/* QUICK LINKS */}
        <div className="footer-column">

          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/cart">Cart</Link>

        </div>

        {/* LEGAL */}
        <div className="footer-column">

          <h3>Legal</h3>

          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Refund Policy</a>
          <a href="#">Support</a>

        </div>

        {/* CONTACT */}
        <div className="footer-column">

          <h3>Need Help?</h3>

          <p className="footer-help">
            We're here to help! Reach out to us
            for any questions or concerns.
          </p>

          <div className="footer-contact">
            <Mail size={18} />
            <span>support@evelynstore.com</span>
          </div>

          <div className="footer-contact">
            <Phone size={18} />
            <span>0912 345 6789</span>
          </div>

          <div className="footer-contact">
            <MapPin size={18} />
            <span>Philippines</span>
          </div>

        </div>

      </div>

      <div className="footer-bottom">

        <span>
          © 2026 Evelyn's Store. All Rights Reserved.
        </span>

        <a href="#" className="back-to-top">
          Back to Top
          <ArrowUp size={18} />
        </a>

      </div>

    </footer>
  );
}

export default Footer;