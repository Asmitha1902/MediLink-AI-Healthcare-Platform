import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/DoctorAppointments.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const DoctorAppointments = () => {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completeLoadingId, setCompleteLoadingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/doctor-login");
      return;
    }

    fetchAppointments();
  }, []);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/appointments/accepted`,
        getAuthHeaders()
      );

      setAppointments(response.data || []);
    } catch (error) {
      console.log("FETCH DOCTOR APPOINTMENTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (appointmentId) => {
    const confirmComplete = window.confirm(
      "Do you want to mark this appointment as completed?"
    );

    if (!confirmComplete) return;

    try {
      setCompleteLoadingId(appointmentId);

      const response = await axios.put(
        `${API_BASE_URL}/api/doctor/appointments/${appointmentId}/complete`,
        {},
        getAuthHeaders()
      );

      alert(response.data.message || "Appointment marked as completed");
      fetchAppointments();
    } catch (error) {
      console.log("MARK COMPLETED ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to mark appointment completed"
      );
    } finally {
      setCompleteLoadingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "Not available";
    return time.slice(0, 5);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Not available";

    return new Date(dateTime).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="doctor-appointments-page">
      <aside className="doctor-appointments-sidebar">
        <div className="doctor-appointments-logo">👨‍⚕️</div>

        <h2>MediLink AI</h2>
        <p>Doctor Portal</p>

        <button onClick={() => navigate("/doctor-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="doctor-appointments-main">
        <header className="doctor-appointments-header">
          <div>
            <h1>My Appointments</h1>
            <p>
              View confirmed patient appointments approved by the hospital admin.
            </p>
          </div>

          <button className="doctor-refresh-btn" onClick={fetchAppointments}>
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="doctor-appointments-loading">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="doctor-appointments-empty">
            <h3>No accepted appointments</h3>
            <p>
              Hospital-approved patient appointments will appear here.
            </p>
          </div>
        ) : (
          <section className="doctor-appointments-grid">
            {appointments.map((appointment) => (
              <div className="doctor-appointment-card" key={appointment.id}>
                <div className="doctor-appointment-top">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>{appointment.patientCode}</p>
                  </div>

                  <span className="doctor-appointment-status">
                    {appointment.status}
                  </span>
                </div>

                <div className="doctor-appointment-details">
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(appointment.appointmentDate)}</strong>
                  </div>

                  <div>
                    <span>Time</span>
                    <strong>{formatTime(appointment.appointmentTime)}</strong>
                  </div>

                  <div>
                    <span>Patient Phone</span>
                    <strong>{appointment.patientPhone || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Patient Place</span>
                    <strong>{appointment.patientPlace || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Hospital</span>
                    <strong>{appointment.hospitalName || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Requested At</span>
                    <strong>{formatDateTime(appointment.requestedAt)}</strong>
                  </div>
                </div>

                <div className="doctor-appointment-reason">
                  <span>Reason / Symptoms</span>
                  <p>{appointment.reason || "No reason provided"}</p>
                </div>

                <div className="doctor-appointment-actions">
                  <button
                    className="doctor-complete-btn"
                    onClick={() => markCompleted(appointment.id)}
                    disabled={completeLoadingId === appointment.id}
                  >
                    {completeLoadingId === appointment.id
                      ? "Updating..."
                      : "Mark Completed"}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorAppointments;