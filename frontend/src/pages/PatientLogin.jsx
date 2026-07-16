import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const PatientLogin = () => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    fullName: "",
    phone: "",
    email: "",
    placeName: "",
    password: "",
  });

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const saveUserData = (data) => {
    localStorage.setItem("patientToken", data.token || "");
    localStorage.setItem("patientId", data.patientId || "");
    localStorage.setItem("fullName", data.fullName || "");
    localStorage.setItem("userEmail", data.email || "");
    localStorage.setItem("userPhone", data.phone || "");
    localStorage.setItem("userRole", data.role || "");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8081/api/patient/login",
        {
          email: loginData.email.trim().toLowerCase(),
          password: loginData.password.trim(),
        }
      );

      alert(response.data.message);
      saveUserData(response.data);

      navigate("/patient-dashboard");
    } catch (error) {
      console.log("PATIENT LOGIN ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Invalid email or password"
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const patientEmail = registerData.email.trim().toLowerCase();

      const response = await axios.post(
        "http://localhost:8081/api/patient/register",
        {
          fullName: registerData.fullName.trim(),
          phone: registerData.phone.trim(),
          email: patientEmail,
          placeName: registerData.placeName.trim(),
          password: registerData.password.trim(),
        }
      );

      alert(response.data.message);

      setRegisteredEmail(patientEmail);
      setOtpMode(true);
    } catch (error) {
      console.log("PATIENT REGISTER ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Registration failed"
      );
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8081/api/patient/verify-otp",
        {
          email: registeredEmail.trim().toLowerCase(),
          otp: otp.trim(),
        }
      );

      alert(response.data.message + ". Please login now.");

      setLoginData({
        email: registeredEmail.trim().toLowerCase(),
        password: "",
      });

      setOtp("");
      setOtpMode(false);
      setIsRegister(false);
      setRegisteredEmail("");

      setRegisterData({
        fullName: "",
        phone: "",
        email: "",
        placeName: "",
        password: "",
      });
    } catch (error) {
      console.log("OTP VERIFY ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Invalid or expired OTP"
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8081/api/patient/resend-otp",
        {
          email: registeredEmail.trim().toLowerCase(),
        }
      );

      alert(response.data.message);
    } catch (error) {
      console.log("RESEND OTP ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to resend OTP"
      );
    }
  };

  const resetRegisterForm = () => {
    setIsRegister(false);
    setOtpMode(false);
    setOtp("");
    setRegisteredEmail("");

    setRegisterData({
      fullName: "",
      phone: "",
      email: "",
      placeName: "",
      password: "",
    });
  };

  return (
    <div className="auth-wrapper">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="auth-card">
        <div className="auth-left patient">
          <div className="left-content">
            <div className="icon">👤</div>
            <h1>Patient Portal</h1>
            <p>
              Secure and manage your healthcare digitally with our smart patient
              system.
            </p>

            <div className="feature">✓ Secure Medical Records</div>
            <div className="feature">✓ Easy Appointment Booking</div>
            <div className="feature">✓ Digital Prescriptions</div>
          </div>
        </div>

        <div className="auth-right">
          <div className="form-container">
            <h2>
              {!isRegister
                ? "Welcome Back"
                : otpMode
                ? "Verify OTP"
                : "Create Account"}
            </h2>

            <p className="sub-text">
              {!isRegister
                ? "Sign in to your account"
                : otpMode
                ? `Enter the OTP sent to ${registeredEmail}`
                : "Register as a new patient"}
            </p>

            {!isRegister ? (
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    type="email"
                    name="email"
                    className="patient"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                  />
                  <label>Email</label>
                </div>

                <div className="input-group password-input-group">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    className="patient"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                  />
                  <label>Password</label>

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <div className="forgot-password">
                  <span onClick={() => navigate("/forgot-password")}>
                    Forgot Password?
                  </span>
                </div>

                <button type="submit" className="primary-btn patient">
                  Sign In
                </button>

                <p className="bottom-text patient">
                  Don’t have an account?{" "}
                  <span onClick={() => setIsRegister(true)}>
                    Create Account
                  </span>
                </p>
              </form>
            ) : otpMode ? (
              <form onSubmit={handleVerifyOtp}>
                <div className="input-group">
                  <input
                    type="text"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    required
                  />
                  <label>Enter OTP</label>
                </div>

                <button type="submit" className="primary-btn patient">
                  Verify OTP
                </button>

                <p className="bottom-text patient">
                  Didn’t receive OTP?{" "}
                  <span onClick={handleResendOtp}>Resend OTP</span>
                </p>

                <p className="bottom-text patient">
                  Wrong email?{" "}
                  <span onClick={resetRegisterForm}>Register Again</span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="double-row">
                  <div className="input-group">
                    <input
                      type="text"
                      name="fullName"
                      value={registerData.fullName}
                      onChange={handleRegisterChange}
                      required
                    />
                    <label>Full Name</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="tel"
                      name="phone"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      required
                    />
                    <label>Phone Number</label>
                  </div>
                </div>

                <div className="double-row">
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                    <label>Email</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="text"
                      name="placeName"
                      value={registerData.placeName}
                      onChange={handleRegisterChange}
                      required
                    />
                    <label>Place Name</label>
                  </div>
                </div>

                <div className="input-group password-input-group">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                  <label>Password</label>

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() =>
                      setShowRegisterPassword(!showRegisterPassword)
                    }
                  >
                    {showRegisterPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <button type="submit" className="primary-btn patient">
                  Create Account
                </button>

                <p className="bottom-text patient">
                  Already have an account?{" "}
                  <span onClick={() => setIsRegister(false)}>Sign In</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;