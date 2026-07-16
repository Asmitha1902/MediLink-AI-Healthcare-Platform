import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientAppointments.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const PatientAppointments = () => {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("patientToken") ||
    localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/patient/appointments/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppointments(response.data || []);
    } catch (error) {
      console.log("FETCH PATIENT APPOINTMENTS ERROR:", error);
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

  const getStatusMessage = (status) => {
    if (status === "PENDING") {
      return "Waiting for hospital approval";
    }

    if (status === "ACCEPTED") {
      return "Appointment confirmed by hospital";
    }

    if (status === "REJECTED") {
      return "Appointment rejected by hospital";
    }

    if (status === "COMPLETED") {
      return "Consultation completed";
    }

    if (status === "CANCELLED") {
      return "Appointment cancelled";
    }

    return "Status not available";
  };

  const getStatusClass = (status) => {
    if (!status) return "status-pending";
    return `status-${status.toLowerCase()}`;
  };

  return (
    <div className="patient-appointments-page">
      <aside className="patient-appointments-sidebar">
        <div className="patient-appointments-logo">👤</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="patient-appointments-main">
        <header className="patient-appointments-header">
          <div>
            <h1>My Appointments</h1>
            <p>
              Track your appointment requests, hospital approval status, and
              consultation updates.
            </p>
          </div>

          <button
            className="patient-refresh-btn"
            onClick={fetchAppointments}
          >
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="patient-appointments-loading">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="patient-appointments-empty">
            <h3>No appointments yet</h3>
            <p>
              Search doctors and request an appointment. Your appointment status
              will appear here.
            </p>

            <button onClick={() => navigate("/patient/doctors")}>
              Search Doctors
            </button>
          </div>
        ) : (
          <section className="patient-appointments-grid">
            {appointments.map((appointment) => (
              <div className="patient-appointment-card" key={appointment.id}>
                <div className="patient-appointment-top">
                  <div>
                    <h3>Dr. {appointment.doctorName}</h3>
                    <p>{appointment.specialization}</p>
                  </div>

                  <span className={getStatusClass(appointment.status)}>
                    {appointment.status}
                  </span>
                </div>

                <div className="patient-status-message">
                  {getStatusMessage(appointment.status)}
                </div>

                <div className="patient-appointment-details">
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(appointment.appointmentDate)}</strong>
                  </div>

                  <div>
                    <span>Time</span>
                    <strong>{formatTime(appointment.appointmentTime)}</strong>
                  </div>

                  <div>
                    <span>Hospital</span>
                    <strong>{appointment.hospitalName || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Doctor ID</span>
                    <strong>{appointment.doctorCode || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Qualification</span>
                    <strong>{appointment.qualification || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Experience</span>
                    <strong>{appointment.experience || 0} years</strong>
                  </div>
                </div>

                <div className="patient-appointment-reason">
                  <span>Reason / Symptoms</span>
                  <p>{appointment.reason || "No reason provided"}</p>
                </div>

                {appointment.rejectionReason && (
                  <div className="patient-rejection-reason">
                    <span>Rejection Reason</span>
                    <p>{appointment.rejectionReason}</p>
                  </div>
                )}

                <div className="patient-appointment-meta">
                  <p>
                    <strong>Requested At:</strong>{" "}
                    {formatDateTime(appointment.requestedAt)}
                  </p>

                  {appointment.respondedAt && (
                    <p>
                      <strong>Hospital Response:</strong>{" "}
                      {formatDateTime(appointment.respondedAt)}
                    </p>
                  )}

                  {appointment.completedAt && (
                    <p>
                      <strong>Completed At:</strong>{" "}
                      {formatDateTime(appointment.completedAt)}
                    </p>
                  )}
                </div>

                {appointment.status === "PENDING" && (
                  <div className="patient-info-note pending-note">
                    Hospital admin will accept or reject your request.
                  </div>
                )}

                {appointment.status === "ACCEPTED" && (
                  <div className="patient-info-note accepted-note">
                    Your appointment is confirmed. Please visit hospital on time.
                  </div>
                )}

                {appointment.status === "COMPLETED" && (
                  <div className="patient-info-note completed-note">
                    Consultation completed successfully.
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default PatientAppointments;