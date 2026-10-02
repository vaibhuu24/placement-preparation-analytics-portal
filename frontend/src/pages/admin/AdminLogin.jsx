import { useState } from "react";
import { Link } from "react-router-dom";

import {
  FaGraduationCap,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaUsers,
  FaBuilding,
  FaChartPie,
} from "react-icons/fa";

function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Invalid admin email or password."
        );
      }

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      // Save admin profile.
      storage.setItem(
        "admin",
        JSON.stringify(data.admin)
      );

      // IMPORTANT: Save the JWT returned by Flask.
      // All protected admin APIs use this token.
      if (!data.access_token) {
        throw new Error(
          "Admin login succeeded, but Flask did not return an access token."
        );
      }

      storage.setItem(
        "admin_access_token",
        data.access_token
      );

      // Remove stale admin data/token from the other storage.
      const otherStorage = rememberMe
        ? sessionStorage
        : localStorage;

      otherStorage.removeItem("admin");
      otherStorage.removeItem("admin_access_token");

      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        error.message || "Cannot connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">

      <div className="admin-auth-container">

        {/* ================= LEFT SIDE ================= */}

        <div className="admin-brand-panel">

          <div>

            {/* Logo */}

            <div className="admin-brand-logo-row">

              <div className="admin-brand-logo">
                <FaGraduationCap />
              </div>

              <div>
                <h1>Placement Portal</h1>
                <p>Administration Panel</p>
              </div>

            </div>

            {/* Main Content */}

            <div className="admin-brand-content">

              <span>
                TRAINING & PLACEMENT MANAGEMENT
              </span>

              <h2>
                Manage.
                <br />
                Analyze.
                <br />
                Place.
              </h2>

              <p>
                Manage students, companies, placement drives,
                applications, quizzes and analytics from one
                centralized platform.
              </p>

            </div>

            {/* Features */}

            <div className="admin-features">

              <div className="admin-feature">

                <div className="admin-feature-icon">
                  <FaUsers />
                </div>

                <div>
                  <h3>Student Management</h3>
                  <p>
                    Manage student profiles and placement status.
                  </p>
                </div>

              </div>

              <div className="admin-feature">

                <div className="admin-feature-icon">
                  <FaBuilding />
                </div>

                <div>
                  <h3>Company Management</h3>
                  <p>
                    Manage recruiters and placement drives.
                  </p>
                </div>

              </div>

              <div className="admin-feature">

                <div className="admin-feature-icon">
                  <FaChartPie />
                </div>

                <div>
                  <h3>Analytics & Reports</h3>
                  <p>
                    Monitor placement performance and statistics.
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Footer */}

          <p className="admin-brand-footer">
            © 2026 Placement Preparation & Analytics Portal <p>Developed by Vaibhav Desale</p>
          </p>
          

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="admin-login-panel">

          <div className="admin-login-wrapper">

            {/* Mobile Logo */}

            <div className="admin-mobile-brand">

              <div>
                <FaGraduationCap />
              </div>

              <h1>Placement Portal</h1>

              <p>Administration Panel</p>

            </div>

            {/* Header */}

            <div className="admin-login-header">

              <span className="admin-badge">
                Admin Portal
              </span>

              <h2>
                Welcome, Officer 👋
              </h2>

              <p>
                Sign in to manage placement activities.
              </p>

            </div>

            {/* Error */}

            {error && (
              <div className="admin-error">
                ⚠ {error}
              </div>
            )}

            {/* ================= FORM ================= */}

            <form onSubmit={handleSubmit}>

              {/* Email */}

              <div className="admin-form-group">

                <label htmlFor="admin-email">
                  Official Email
                </label>

                <div className="admin-input-wrapper">

                  <FaEnvelope className="admin-input-icon" />

                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="officer@college.edu"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* Password */}

              <div className="admin-form-group">

                <label htmlFor="admin-password">
                  Password
                </label>

                <div className="admin-input-wrapper">

                  <FaLock className="admin-input-icon" />

                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>

              {/* Options */}

              <div className="admin-login-options">

                <label className="remember-label">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />

                  <span>Remember me</span>

                </label>

                <button
                  type="button"
                  className="forgot-password-button"
                >
                  Forgot Password?
                </button>

              </div>

              {/* Login Button */}

              <button
                type="submit"
                className="admin-login-button-primary"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="admin-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Admin Sign In</span>
                    <FaArrowRight />
                  </>
                )}

              </button>

            </form>

            {/* ================= LOGIN LINKS ================= */}

            <div className="admin-student-login">

              <div className="admin-login-link-item">

                <span>
                  Are you a student?
                </span>

                <Link to="/login">
                  Student Login
                </Link>

              </div>

              <div className="admin-login-link-item">

                <span>
                  Don't have an admin account?
                </span>

                <Link to="/admin/register">
                  Register Admin
                </Link>

              </div>

            </div>

            {/* Security */}

            <div className="admin-security">

              <FaShieldAlt />

              <span>
                Authorized personnel only
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminLogin;