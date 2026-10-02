import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminRegister.css";

import {
  FaGraduationCap,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";

function AdminRegister() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/admin/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Admin registration failed."
        );
      }

      setSuccess(
        "Admin registered successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);

    } catch (error) {
      console.error(
        "Admin registration error:",
        error
      );

      setError(
        error.message || "Cannot connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-page">

      <div className="admin-register-card">

        {/* HEADER */}

        <div className="admin-register-header">

          <div className="admin-register-logo">
            <FaGraduationCap />
          </div>

          <span className="admin-register-badge">
            Admin Portal
          </span>

          <h1>Create Admin Account</h1>

          <p>
            Register an administrator for the Placement Portal.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="admin-register-message admin-register-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="admin-register-message admin-register-success">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          <div className="admin-register-form-group">

            <label htmlFor="admin-name">
              Full Name
            </label>

            <div className="admin-register-input-wrapper">

              <FaUser className="admin-register-input-icon" />

              <input
                id="admin-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter admin name"
                autoComplete="name"
                required
              />

            </div>

          </div>

          {/* EMAIL */}

          <div className="admin-register-form-group">

            <label htmlFor="admin-register-email">
              Official Email
            </label>

            <div className="admin-register-input-wrapper">

              <FaEnvelope className="admin-register-input-icon" />

              <input
                id="admin-register-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@college.edu"
                autoComplete="email"
                required
              />

            </div>

          </div>

          {/* PHONE */}

          <div className="admin-register-form-group">

            <label htmlFor="admin-phone">
              Phone Number
            </label>

            <div className="admin-register-input-wrapper">

              <FaPhone className="admin-register-input-icon" />

              <input
                id="admin-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                autoComplete="tel"
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="admin-register-form-group">

            <label htmlFor="admin-register-password">
              Password
            </label>

            <div className="admin-register-input-wrapper">

              <FaLock className="admin-register-input-icon" />

              <input
                id="admin-register-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="admin-register-password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
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

          {/* CONFIRM PASSWORD */}

          <div className="admin-register-form-group">

            <label htmlFor="admin-confirm-password">
              Confirm Password
            </label>

            <div className="admin-register-input-wrapper">

              <FaLock className="admin-register-input-icon" />

              <input
                id="admin-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="admin-register-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>

            </div>

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            className="admin-register-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-register-spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                Create Admin Account
                <FaArrowRight />
              </>
            )}
          </button>

        </form>

        {/* LOGIN */}

        <div className="admin-register-login">

          <span>
            Already have an account?
          </span>

          <Link to="/admin/login">
            Admin Login
          </Link>

        </div>

        {/* SECURITY */}

        <div className="admin-register-security">

          <FaShieldAlt />

          <span>
            Authorized personnel only
          </span>

        </div>

      </div>

    </div>
  );
}

export default AdminRegister;