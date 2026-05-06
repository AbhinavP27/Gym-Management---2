import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const validate = () => {
    const newErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!emailPattern.test(email)) newErrors.email = "Enter a valid email";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    const result = await login(email.trim(), password.trim());

    if (result.ok) {
      toast.success("Login successful!");
      const { user } = result;
      
      // Navigate based on normalized role
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "trainer") {
        navigate(`/trainer/${user.id}`);
      } else {
        navigate(`/user/${user.id}`);
      }
    } else {
      toast.error(result.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="login-overlay register-overlay" id="login">
      <div className="login-card register-card login-card--login">
        <button
          type="button"
          className="close-button"
          aria-label="Close login"
          onClick={() => navigate("/")}
        />
        <p className="eyebrow">Welcome back</p>
        <h2>Urban Grind Login</h2>
        <p className="subtext">Slip in, sign on, and pick up where you left off.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={`icon-toggle inside ${showPassword ? "active" : ""}`}
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)}
              />
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </label>

          <div className="action-row">
            <button type="submit" className="lg-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
           <p className="link-cta mt-3">Not joined yet?</p>
            <Link to="/join" className="link-ctan">
               Join now
            </Link>
          </div>

          <p className="policy-text">
            By logging in, you agree to our{" "}
            <a href="/privacy" onClick={(e) => {e.preventDefault(); setShowPrivacy(true);}}>
              Privacy Policy
            </a>.
          </p>
        </form>

        {showPrivacy && (
          <div className="privacy-overlay">
            <div className="privacy-card">
              <button
                type="button"
                className="close-button"
                aria-label="Close privacy policy"
                onClick={() => setShowPrivacy(false)}
              />
              <h3>Privacy Policy</h3>
              <p>We collect only the data needed to create and manage your membership, schedule sessions, and process payments.</p>
              <ul>
                <li>Contact info (name, email, phone, address) for account and notifications.</li>
                <li>Fitness preferences and medical flags to tailor safe programming.</li>
                <li>Device and session data to keep your account secure.</li>
              </ul>
              <p>We never sell your data. You can request deletion or updates at any time by contacting support.</p>
              <button className="primary-cta" onClick={() => setShowPrivacy(false)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
