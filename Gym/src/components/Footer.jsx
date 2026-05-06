import React from 'react'
import './style/Footer.css'
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section">
          <h2>UrbanGrind</h2>
          <p>
            Push your limits and transform your body at UrbanGrind.
            Modern equipment, expert trainers, and the motivation
            you need to reach your fitness goals.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
           <a href="#hero"><li>Home</li></a> 
            <a href="#plans"><li>Programs</li></a>
            <a href="#trainers"><li>Trainers</li></a>
            <a href="#membership"><li>Membership</li></a>
            <a href="#contact"><li>Contact</li></a>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>📍 Thrissur, Kerala</p>
          <p>📞 +91 9876543210 </p>
          <p>📞 +91 9995161150</p>
          <p>✉️ hello@urbangrind.fit</p>
        </div>

<div className="footer-section">
  <h3>Follow Us</h3>

  <div className="social-icons">
    <a href="https://instagram.com" target="_blank" className='instagram'>
      <FaInstagram />
    </a>

    <a href="https://facebook.com" target="_blank" className='facebook'>
      <FaFacebook />
    </a>

    <a href="https://youtube.com" target="_blank" className='youtube'>
      <FaYoutube />
    </a>
  </div>
</div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 UrbanGrind Gym | All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer