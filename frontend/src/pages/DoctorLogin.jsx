import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const DoctorLogin = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const saveDoctorData = (data) => {
    localStorage.setItem("doctorToken", data.token || "");
    localStorage.setItem("doctorId", data.doctorId || "");
    localStorage.setItem("doctorName", data.fullName || "");
    localStorage.setItem("doctorEmail", data.email || "");
    localStorage.setItem("doctorPhone", data.phone || "");
    localStorage.setItem("doctorRole", data.role || "");

    localStorage.setItem("doctorSpecialization", data.specialization || "");
    localStorage.setItem("doctorQualification", data.qualification || "");
    localStorage.setItem("doctorExperience", data.experience || "");
    localStorage.setItem("doctorStatus", data.status || "");

    localStorage.setItem("doctorHospitalCode", data.hospitalCode || "");
    localStorage.setItem("doctorHospitalName", data.hospitalName || "");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8081/api/doctor/login",
        {
          identifier: loginData.identifier,
          password: loginData.password,
        }
      );

      alert(response.data.message);

      saveDoctorData(response.data);

      navigate("/doctor-dashboard");
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
          "Invalid Doctor ID/Email or password"
      );
    }
  };

  return (
    <div className="auth-wrapper">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="auth-card">
        <div className="auth-left doctor">
          <div className="left-content">
            <div className="icon">👨‍⚕️</div>

            <h1>Doctor Portal</h1>

            <p>
              Access patient records, manage availability, and update
              prescriptions securely.
            </p>

            <div className="feature">✓ View Approved Patient Records</div>
            <div className="feature">✓ Add Prescriptions</div>
            <div className="feature">✓ Update Availability</div>
          </div>
        </div>

        <div className="auth-right">
          <div className="form-container">
            <h2>Welcome Back</h2>

            <p className="sub-text">
              Sign in with your Doctor ID or registered email
            </p>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  type="text"
                  name="identifier"
                  className="doctor"
                  value={loginData.identifier}
                  onChange={handleLoginChange}
                  required
                />
                <label>Doctor ID or Email</label>
              </div>

              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  className="doctor"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <label>Password</label>
              </div>

              <button type="submit" className="primary-btn doctor">
                Sign In
              </button>

              <p className="bottom-text doctor">
                Account created by hospital admin. Use the Doctor ID and
                temporary password sent to your email.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;