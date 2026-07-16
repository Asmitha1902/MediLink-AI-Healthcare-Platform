import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/DoctorDashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("doctorToken");

  const [profile, setProfile] = useState(null);
  const [acceptedAppointmentCount, setAcceptedAppointmentCount] = useState(0);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/doctor-login");
      return;
    }

    fetchProfile();
    fetchAcceptedAppointments();
  }, []);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/profile`,
        getAuthHeaders()
      );

      setProfile(response.data);
      localStorage.setItem("doctorStatus", response.data.status || "");
    } catch (error) {
      console.log("DOCTOR PROFILE ERROR:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const fetchAcceptedAppointments = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/appointments/accepted`,
        getAuthHeaders()
      );

      setAcceptedAppointmentCount(response.data?.length || 0);
    } catch (error) {
      console.log("FETCH DOCTOR APPOINTMENTS ERROR:", error);
      setAcceptedAppointmentCount(0);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/doctor/change-password`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        getAuthHeaders()
      );

      alert(response.data.message);

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.log("CHANGE PASSWORD ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to change password"
      );
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/doctor/my-status`,
        {
          status: newStatus,
        },
        getAuthHeaders()
      );

      setProfile(response.data);
      localStorage.setItem("doctorStatus", response.data.status || "");
    } catch (error) {
      console.log("STATUS UPDATE ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update status"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorId");
    localStorage.removeItem("doctorName");
    localStorage.removeItem("doctorEmail");
    localStorage.removeItem("doctorPhone");
    localStorage.removeItem("doctorRole");
    localStorage.removeItem("doctorSpecialization");
    localStorage.removeItem("doctorQualification");
    localStorage.removeItem("doctorExperience");
    localStorage.removeItem("doctorStatus");
    localStorage.removeItem("doctorHospitalCode");
    localStorage.removeItem("doctorHospitalName");
    localStorage.removeItem("pendingQrAccessToken");

    navigate("/doctor-login");
  };

  const formatStatus = (status) => {
    if (!status) {
      return "AVAILABLE";
    }

    return status.replaceAll("_", " ");
  };

  return (
    <div className="doctor-dashboard">
      <aside className="doctor-dash-sidebar">
        <div className="doctor-dash-logo">👨‍⚕️</div>

        <h2>MediLink AI</h2>
        <p>Doctor Portal</p>

        <button className="doctor-side-active">Profile</button>

        <button onClick={() => navigate("/doctor/qr-access")}>
          Scan Patient QR
        </button>

        <button onClick={() => navigate("/doctor/appointments")}>
          Appointments
        </button>

        <button>
          Patient Records
        </button>

        <button disabled title="Coming after prescription module">
          Prescriptions
        </button>

        <button className="doctor-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="doctor-dash-main">
        <header className="doctor-dash-header">
          <div>
            <h1>Doctor Dashboard</h1>
            <p>
              Manage your profile, appointments, QR access, password, and
              patient-related tasks.
            </p>
          </div>

          <div className="doctor-status-card">
            <p>Current Status</p>

            <h3>{formatStatus(profile?.status)}</h3>

            <select
              className="doctor-status-select"
              value={profile?.status || "AVAILABLE"}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="NOT_AVAILABLE">Not Available</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="BUSY">Busy</option>
              <option value="IN_EMERGENCY">In Emergency</option>
            </select>
          </div>
        </header>

        <section className="doctor-quick-actions">
          <div className="doctor-quick-card">
            <div className="doctor-quick-icon">📷</div>

            <div>
              <h3>Scan Patient QR</h3>
              <p>
                Scan or upload patient QR code to request access for selected
                medical reports.
              </p>
            </div>

            <button onClick={() => navigate("/doctor/qr-access")}>
              Scan QR
            </button>
          </div>

          <div className="doctor-quick-card">
            <div className="doctor-quick-icon">📅</div>

            <div>
              <h3>Appointments</h3>
              <p>
                You have {acceptedAppointmentCount} hospital-approved
                appointment{acceptedAppointmentCount === 1 ? "" : "s"}.
              </p>
            </div>

            <button onClick={() => navigate("/doctor/appointments")}>
              View Appointments
            </button>
          </div>
        </section>

        <section className="doctor-profile-grid">
          <div className="doctor-profile-card">
            <h2>My Profile</h2>

            <div className="doctor-avatar">👨‍⚕️</div>

            <h3>{profile?.fullName || "Doctor Name"}</h3>
            <p>{profile?.specialization || "Specialization"}</p>

            <div className="doctor-info-list">
              <div>
                <span>Doctor ID</span>
                <b>{profile?.doctorId || "-"}</b>
              </div>

              <div>
                <span>Email</span>
                <b>{profile?.email || "-"}</b>
              </div>

              <div>
                <span>Phone</span>
                <b>{profile?.phone || "-"}</b>
              </div>

              <div>
                <span>Qualification</span>
                <b>{profile?.qualification || "-"}</b>
              </div>

              <div>
                <span>Experience</span>
                <b>{profile?.experience || 0} years</b>
              </div>

              <div>
                <span>Hospital</span>
                <b>{profile?.hospitalName || "-"}</b>
              </div>

              <div>
                <span>Hospital Code</span>
                <b>{profile?.hospitalCode || "-"}</b>
              </div>

              <div>
                <span>Current Status</span>
                <b>{formatStatus(profile?.status)}</b>
              </div>

              <div>
                <span>Accepted Appointments</span>
                <b>{acceptedAppointmentCount}</b>
              </div>
            </div>
          </div>

          <div className="doctor-password-card">
            <h2>Change Password</h2>
            <p>Change the temporary password given by hospital admin.</p>

            <form onSubmit={handleChangePassword}>
              <div className="doctor-form-group">
                <label>Old Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="doctor-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="doctor-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <button type="submit">Update Password</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;