import { useState } from "react";
import { Link } from "react-router-dom";

import {
  FaGraduationCap,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaIdCard,
  FaBuilding,
  FaBook,
  FaChartLine,
  FaShieldAlt,
} from "react-icons/fa";

function Register() {
  const departmentYears = {
    MCA: ["First Year", "Second Year"],
    IMCA: [
      "First Year",
      "Second Year",
      "Third Year",
      "Fourth Year",
      "Fifth Year",
    ],
    BCA: ["First Year", "Second Year", "Third Year"],
    BBA: ["First Year", "Second Year", "Third Year"],
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    rollNumber: "",
    prn: "",
    department: "",
    branch: "",
    currentYear: "",
    cgpa: "",
    backlogs: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "department") {
      setFormData((prev) => ({
        ...prev,
        department: value,
        currentYear: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Department and current year validation
    if (!formData.department) {
      setError("Please select a department.");
      return;
    }

    if (!formData.currentYear) {
      setError("Please select your current year.");
      return;
    }

    const allowedYears = departmentYears[formData.department] || [];

    if (!allowedYears.includes(formData.currentYear)) {
      setError("Please select a valid year for your department.");
      return;
    }

    // CGPA validation
    if (
      formData.cgpa === "" ||
      Number(formData.cgpa) < 0 ||
      Number(formData.cgpa) > 10
    ) {
      setError("CGPA must be between 0 and 10.");
      return;
    }

    // Backlogs validation
    if (
      formData.backlogs === "" ||
      Number(formData.backlogs) < 0
    ) {
      setError("Backlogs cannot be negative.");
      return;
    }

    // Password strength
    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/student/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentName: formData.studentName,
            email: formData.email,
            rollNumber: formData.rollNumber,
            prn: formData.prn,
            department: formData.department,
            branch: formData.branch,
            currentYear: formData.currentYear,
            cgpa: formData.cgpa,
            backlogs: formData.backlogs,
            phone: formData.phone,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Registration failed. Please try again."
        );
      }

      // Do not keep password data in the form after successful registration.
      setFormData({
        studentName: "",
        email: "",
        rollNumber: "",
        prn: "",
        department: "",
        branch: "",
        currentYear: "",
        cgpa: "",
        backlogs: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      alert(
        data.message ||
        "Student account created successfully. Please sign in."
      );

      // Go to Student Login
      window.location.href = "/login";

    } catch (error) {
      console.error("Student registration error:", error);

      setError(
        error.message ||
        "Cannot connect to backend. Make sure Flask server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-container">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="register-header">

          <div className="register-logo">
            <FaGraduationCap />
          </div>

          <h1>
            Create Student Account
          </h1>

          <p>
            Join the Placement Preparation & Analytics Portal
          </p>

        </div>


        {/* =====================================================
            FORM CARD
        ====================================================== */}

        <div className="register-card">

          <form onSubmit={handleSubmit}>

            <div className="register-card-body">

              {/* Error */}

              {error && (
                <div className="register-error">
                  ⚠ {error}
                </div>
              )}


              {/* =================================================
                  PERSONAL INFORMATION
              ================================================== */}

              <SectionHeader
                icon={<FaUser />}
                title="Personal Information"
                description="Enter your basic personal details"
              />

              <div className="register-grid">

                <Input
                  label="Student Name"
                  name="studentName"
                  placeholder="Enter your full name"
                  value={formData.studentName}
                  onChange={handleChange}
                  icon={<FaUser />}
                />

                <Input
                  label="College Email"
                  name="email"
                  type="email"
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<FaEnvelope />}
                />

                <Input
                  label="Roll Number"
                  name="rollNumber"
                  placeholder="Enter roll number"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  icon={<FaIdCard />}
                />

                <Input
                  label="PRN"
                  name="prn"
                  placeholder="Enter PRN"
                  value={formData.prn}
                  onChange={handleChange}
                  icon={<FaIdCard />}
                />

                <Select
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  icon={<FaBuilding />}
                  options={[
                    "MCA",
                    "IMCA",
                    "BCA",
                    "BBA",
                  ]}
                />

                <Input
                  label="Branch"
                  name="branch"
                  placeholder="Enter branch"
                  value={formData.branch}
                  onChange={handleChange}
                  icon={<FaBook />}
                />

              </div>


              {/* =================================================
                  ACADEMIC INFORMATION
              ================================================== */}

              <SectionHeader
                icon={<FaChartLine />}
                title="Academic Information"
                description="Provide your current academic details"
              />

              <div className="register-grid">

                <Select
                  label="Current Year"
                  name="currentYear"
                  value={formData.currentYear}
                  onChange={handleChange}
                  icon={<FaGraduationCap />}
                  options={
                    departmentYears[formData.department] || []
                  }
                />

                <Input
                  label="CGPA"
                  name="cgpa"
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  placeholder="Example: 8.51"
                  value={formData.cgpa}
                  onChange={handleChange}
                  icon={<FaChartLine />}
                />

                <Input
                  label="Backlogs"
                  name="backlogs"
                  type="number"
                  min="0"
                  placeholder="Enter number of backlogs"
                  value={formData.backlogs}
                  onChange={handleChange}
                  icon={<FaBook />}
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<FaPhone />}
                />

              </div>


              {/* =================================================
                  SECURITY
              ================================================== */}

              <SectionHeader
                icon={<FaShieldAlt />}
                title="Account Security"
                description="Create a secure password for your account"
              />

              <div className="register-grid">

                <PasswordInput
                  label="Password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  show={showPassword}
                  onToggle={() =>
                    setShowPassword(!showPassword)
                  }
                />

                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  show={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                />

              </div>


              {/* =================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="register-button"
              >

                {loading ? (
                  <>
                    <span className="register-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Student Account
                    <FaArrowRight />
                  </>
                )}

              </button>

            </div>


            {/* =================================================
                FOOTER
            ================================================== */}

            <div className="register-card-footer">

              <span>
                Already have an account?
              </span>

              <Link to="/login">
                Sign In
              </Link>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div className="section-header">

      <div className="section-icon">
        {icon}
      </div>

      <div>
        <h2>{title}</h2>

        <p>{description}</p>
      </div>

    </div>
  );
}


/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  min,
  max,
  step,
}) {
  return (
    <div className="register-form-group">

      <label htmlFor={name}>
        {label}
      </label>

      <div className="register-input-wrapper">

        {icon && (
          <span className="register-input-icon">
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          required
        />

      </div>

    </div>
  );
}


/* ============================================================
   SELECT
============================================================ */

function Select({
  label,
  name,
  value,
  onChange,
  options,
  icon,
}) {
  return (
    <div className="register-form-group">

      <label htmlFor={name}>
        {label}
      </label>

      <div className="register-input-wrapper">

        {icon && (
          <span className="register-input-icon">
            {icon}
          </span>
        )}

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required
        >

          <option value="">
            Select {label}
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}

        </select>

      </div>

    </div>
  );
}


/* ============================================================
   PASSWORD
============================================================ */

function PasswordInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
}) {
  return (
    <div className="register-form-group">

      <label htmlFor={name}>
        {label}
      </label>

      <div className="register-input-wrapper">

        <FaLock className="register-input-icon" />

        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />

        <button
          type="button"
          className="register-password-toggle"
          onClick={onToggle}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>

      </div>

    </div>
  );
}

export default Register;