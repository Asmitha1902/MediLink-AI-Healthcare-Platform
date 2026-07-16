import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/AdminDashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const hospitalEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");
  const hospitalName = localStorage.getItem("hospitalName");
  const hospitalCode = localStorage.getItem("hospitalCode");
  const hospitalCity = localStorage.getItem("hospitalCity");

  const [doctorCount, setDoctorCount] = useState(0);
  const [totalQueue, setTotalQueue] = useState(0);
  const [pendingAppointmentCount, setPendingAppointmentCount] = useState(0);

  const [resourceData, setResourceData] = useState({
    icuBeds: 0,
    ambulances: 0,
    emergencyBeds: 0,
  });

  const fetchDoctorData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctor/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctorCount(response.data.length);

      const queueSum = response.data.reduce(
        (sum, doctor) => sum + (doctor.queueCount || 0),
        0
      );

      setTotalQueue(queueSum);
    } catch (error) {
      console.log(error);
      setDoctorCount(0);
      setTotalQueue(0);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/hospital/resources`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResourceData({
        icuBeds: response.data.icuBeds || 0,
        ambulances: response.data.ambulances || 0,
        emergencyBeds: response.data.emergencyBeds || 0,
      });
    } catch (error) {
      console.log(error);
      setResourceData({
        icuBeds: 0,
        ambulances: 0,
        emergencyBeds: 0,
      });
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/hospital/appointments/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPendingAppointmentCount(response.data.length || 0);
    } catch (error) {
      console.log("FETCH APPOINTMENT REQUESTS ERROR:", error);
      setPendingAppointmentCount(0);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetchDoctorData();
    fetchResources();
    fetchPendingAppointments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userRole");
    localStorage.removeItem("hospitalCode");
    localStorage.removeItem("hospitalName");
    localStorage.removeItem("hospitalCity");

    navigate("/admin-login");
  };

  const handleAddDoctor = () => {
    navigate("/admin/add-doctor");
  };

  const handleResources = () => {
    navigate("/admin/resources");
  };

  const handleQueue = () => {
    navigate("/admin/queue");
  };

  const handleAppointments = () => {
    navigate("/admin/appointments");
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-logo-box">
          <div className="admin-logo">🏥</div>
          <h2>MediLink AI</h2>
          <p>Hospital Admin</p>
        </div>

        <nav className="admin-nav">
          <button className="active">Dashboard</button>
          <button onClick={handleAddDoctor}>Doctor Management</button>
          <button onClick={handleResources}>Resources</button>
          <button onClick={handleQueue}>Queue Management</button>
          <button onClick={handleAppointments}>
            Appointment Requests
          </button>
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Hospital Admin Dashboard</h1>
            <p>
              Manage doctors, hospital resources, patient queue, and appointment
              requests.
            </p>
          </div>

          <div className="admin-profile-card">
            <p>Logged in as</p>
            <h4>{hospitalEmail || "Hospital Admin"}</h4>
            <span>{userRole || "ROLE_ADMIN"}</span>
          </div>
        </header>

        <section className="admin-workspace-card">
          <div>
            <p>Hospital Workspace</p>
            <h2>{hospitalName || "Hospital Name"}</h2>
            <span>{hospitalCity || "City"}</span>
          </div>

          <div>
            <p>Hospital Code</p>
            <h2>{hospitalCode || "Not Generated"}</h2>
            <span>This code will be used for doctor IDs</span>
          </div>
        </section>

        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div>👨‍⚕️</div>
            <h3>{doctorCount}</h3>
            <p>Doctors Added</p>
          </div>

          <div className="admin-stat-card">
            <div>📅</div>
            <h3>{pendingAppointmentCount}</h3>
            <p>Pending Appointments</p>
          </div>

          <div className="admin-stat-card">
            <div>🛏️</div>
            <h3>{resourceData.icuBeds}</h3>
            <p>ICU Beds Available</p>
          </div>

          <div className="admin-stat-card">
            <div>🚑</div>
            <h3>{resourceData.ambulances}</h3>
            <p>Ambulances</p>
          </div>

          <div className="admin-stat-card">
            <div>🚨</div>
            <h3>{resourceData.emergencyBeds}</h3>
            <p>Emergency Beds</p>
          </div>
        </section>

        <section className="admin-actions-section">
          <h2>Quick Actions</h2>

          <div className="admin-action-grid">
            <div className="admin-action-card">
              <h3>Add Doctor</h3>
              <p>
                Create doctor account with hospital-based doctor ID and
                temporary password.
              </p>
              <button onClick={handleAddDoctor}>Add Doctor</button>
            </div>

            <div className="admin-action-card">
              <h3>Appointment Requests</h3>
              <p>
                Review patient appointment requests and accept or reject them
                based on doctor availability.
              </p>
              <button onClick={handleAppointments}>
                View Requests
              </button>
            </div>

            <div className="admin-action-card">
              <h3>Update Resources</h3>
              <p>
                Update ICU beds, emergency beds, ventilators, and ambulances.
              </p>
              <button onClick={handleResources}>Update Resources</button>
            </div>

            <div className="admin-action-card">
              <h3>Manage Queue</h3>
              <p>Track current queue count and emergency cases in hospital.</p>
              <button onClick={handleQueue}>Manage Queue</button>
            </div>
          </div>
        </section>

        <section className="admin-table-section">
          <h2>Recent Activity</h2>

          {doctorCount === 0 &&
          resourceData.icuBeds === 0 &&
          resourceData.ambulances === 0 &&
          resourceData.emergencyBeds === 0 &&
          totalQueue === 0 &&
          pendingAppointmentCount === 0 ? (
            <div className="admin-empty-box">
              <p>No recent activity yet.</p>
              <span>
                After adding doctors, resources, queue details, and appointment
                requests, activity will appear here.
              </span>
            </div>
          ) : (
            <div className="admin-activity-list">
              {doctorCount > 0 && (
                <div className="admin-activity-item">
                  <span>👨‍⚕️</span>
                  <div>
                    <h4>Doctors Added</h4>
                    <p>{doctorCount} doctors are currently added.</p>
                  </div>
                </div>
              )}

              {pendingAppointmentCount > 0 && (
                <div className="admin-activity-item">
                  <span>📅</span>
                  <div>
                    <h4>Appointment Requests</h4>
                    <p>
                      {pendingAppointmentCount} appointment requests are waiting
                      for hospital approval.
                    </p>
                  </div>
                </div>
              )}

              {(resourceData.icuBeds > 0 ||
                resourceData.ambulances > 0 ||
                resourceData.emergencyBeds > 0) && (
                <div className="admin-activity-item">
                  <span>🛏️</span>
                  <div>
                    <h4>Resources Updated</h4>
                    <p>
                      ICU Beds: {resourceData.icuBeds}, Ambulances:{" "}
                      {resourceData.ambulances}, Emergency Beds:{" "}
                      {resourceData.emergencyBeds}
                    </p>
                  </div>
                </div>
              )}

              {totalQueue > 0 && (
                <div className="admin-activity-item">
                  <span>👥</span>
                  <div>
                    <h4>Queue Updated</h4>
                    <p>Total current patient queue is {totalQueue}.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;