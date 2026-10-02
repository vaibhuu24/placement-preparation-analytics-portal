import { useState } from "react"; 
import { Link } from "react-router-dom"; 

import { 
  FaGraduationCap, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaBriefcase, 
  FaChartLine, 
  FaCheckCircle, 
  FaShieldAlt, 
} from "react-icons/fa"; 

function Login() { 
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

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/student/login",
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
          data.error || "Invalid email or password."
        );
      }

      // Save the logged-in student's information.
      // Remember me = localStorage, otherwise sessionStorage.
      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "student",
        JSON.stringify(data.student)
      );

      // Save JWT access token for protected Student APIs.
      if (data.access_token) {
        storage.setItem("access_token", data.access_token);
      } else {
        console.warn("Student login response did not include access_token.");
      }

      // Remove old student data and token from the other storage.
      const otherStorage = rememberMe
        ? sessionStorage
        : localStorage;

      otherStorage.removeItem("student");
      otherStorage.removeItem("access_token");

      alert(data.message || "Login successful!");

      // Go to Student Dashboard.
      window.location.href = "/student/dashboard";

    } catch (error) {
      console.error("Student login error:", error);

      setError(
        error.message ||
        "Cannot connect to backend. Make sure Flask server is running."
      );
    } finally {
      setLoading(false);
    }
  }; 

  return ( 
    <div className="auth-page"> 

      <div className="auth-container"> 

        {/* ===================================================== 
            LEFT BRANDING PANEL 
        ====================================================== */} 

        <div className="login-brand-panel"> 

          <div className="brand-content"> 

            {/* Logo */} 

            <div className="brand-logo-row"> 

              <div className="brand-logo"> 
                <FaGraduationCap /> 
              </div> 

              <div> 
                <h1>Placement Portal</h1> 

                <p>Smart Placement Management</p> 
              </div> 

            </div> 

            {/* Hero */} 

            <div className="brand-hero"> 

              <span className="hero-small-text"> 
                YOUR CAREER STARTS HERE 
              </span> 

              <h2> 
                Prepare. 
                <br /> 
                Perform. 
                <br /> 
                Get Placed. 
              </h2> 

              <p> 
                Prepare for placements, discover company opportunities, 
                take mock tests and track your career progress in one 
                powerful platform. 
              </p> 

            </div> 

            {/* Features */} 

            <div className="brand-features"> 

              <Feature 
                icon={<FaBriefcase />} 
                title="Placement Opportunities" 
                description="Discover companies and placement drives." 
              /> 

              <Feature 
                icon={<FaChartLine />} 
                title="Performance Analytics" 
                description="Track your preparation and test performance." 
              /> 

              <Feature 
                icon={<FaCheckCircle />} 
                title="Career Preparation" 
                description="Improve your skills with quizzes and practice." 
              /> 

            </div> 

          </div> 

          <p className="brand-footer"> 
            © 2026 Placement Preparation & Analytics Portal  <p>Developed by Vaibhav Desale And Team </p>
          </p> 

        </div> 

        {/* ===================================================== 
            LOGIN PANEL 
        ====================================================== */} 

        <div className="login-form-panel"> 

          <div className="login-form-wrapper"> 

            {/* Mobile Logo */} 

            <div className="mobile-brand"> 

              <div className="mobile-brand-logo"> 
                <FaGraduationCap /> 
              </div> 

              <h1>Placement Portal</h1> 

              <p>Placement Preparation & Analytics </p> 

            </div> 

            {/* Header */} 

            <div className="login-header"> 

              <span className="portal-badge"> 
                Student Portal 
              </span> 

              <h2> 
                Welcome Back <span></span> 
              </h2> 

              <p> 
                Sign in to continue to your placement dashboard. 
              </p> 

            </div> 

            {/* Error */} 

            {error && ( 
              <div className="form-error"> 
                ⚠ {error} 
              </div> 
            )} 

            {/* Form */} 

            <form onSubmit={handleSubmit}> 

              {/* Email */} 

              <div className="form-group"> 

                <label htmlFor="email"> 
                  College Email 
                </label> 

                <div className="input-wrapper"> 

                  <FaEnvelope className="input-icon" /> 

                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="student@college.edu" 
                    autoComplete="email" 
                    required 
                  /> 

                </div> 

              </div> 

              {/* Password */} 

              <div className="form-group"> 

                <label htmlFor="password"> 
                  Password 
                </label> 

                <div className="input-wrapper"> 

                  <FaLock className="input-icon" /> 

                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Enter your password" 
                    autoComplete="current-password" 
                    required 
                  /> 

                  <button 
                    type="button" 
                    className="password-toggle" 
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

              {/* Remember */} 

              <div className="login-options"> 

                <label className="remember-me"> 

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
                  className="forgot-password" 
                > 
                  Forgot Password? 
                </button> 

              </div> 

              {/* Login */} 

              <button 
                type="submit" 
                className="login-button" 
                disabled={loading} 
              > 

                {loading ? ( 
                  <> 
                    <span className="spinner"></span> 
                    Signing in... 
                  </> 
                ) : ( 
                  <> 
                    Sign In 
                    <FaArrowRight /> 
                  </> 
                )} 

              </button> 

            </form> 

            {/* Register */} 

            <div className="register-link"> 

              <span> 
                Don't have an account? 
              </span> 

              <Link to="/register"> 
                Create Account 
              </Link> 

            </div> 

            {/* Divider */} 

            <div className="admin-divider"> 

              <span></span> 

              <p>ADMIN ACCESS</p> 

              <span></span> 

            </div> 

            {/* Admin */} 

            <Link 
              to="/admin/login" 
              className="admin-login-button" 
            > 
              Training & Placement Officer 
              <span>→ Admin Login</span> 
            </Link> 

            {/* Security */} 

            <div className="security-message"> 

              <FaShieldAlt /> 

              <span> 
                Your account information is securely protected. 
              </span> 

            </div> 

          </div> 

        </div> 

      </div> 

    </div> 
  ); 
} 


/* ============================================================ 
   FEATURE COMPONENT 
============================================================ */ 

function Feature({ icon, title, description }) { 
  return ( 
    <div className="feature-item"> 

      <div className="feature-icon"> 
        {icon} 
      </div> 

      <div> 

        <h3>{title}</h3> 

        <p>{description}</p> 

      </div> 

    </div> 
  ); 
} 

export default Login;