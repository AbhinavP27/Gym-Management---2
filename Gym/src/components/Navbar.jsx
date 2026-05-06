import React from "react";
import "./style/Navbar.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// import logo from '../assets/logo-1.png'

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  const controlNavbar = () => {
    const currentY = window.scrollY;
    setShowNavbar(currentY <= lastScrollY.current); // hide on scroll down
    lastScrollY.current = currentY;
  };

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, []);

  return (
    <div className={`navbar shadow-lg ${showNavbar ? "show" : "hide"}`}>
      <a className="navbar-brand fw-bold text-white p-2" href="#hero">
        URBAN
        <span className="b-4 " style={{ color: "#c9f40a" }}>
          GRIND
        </span>
      </a>

      <div
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </div>

      {/* <img className='urban' src={logo} alt="Logo" />   */}

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li>
          <a href="#about">About</a>
        </li>
        <li>
          <a href="#trainers">Trainers</a>
        </li>
        <li>
          <a href="#services">Services</a>
        </li>
        <li>
          <a href="#plans">Plans</a>
        </li>
        <li>
          <a href="#testimonials">Testimonials</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
        <li>
          <Link to="/login" className="join-btn">
            Login
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
