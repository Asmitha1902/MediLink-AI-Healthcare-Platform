import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/HospitalAppointments.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const HospitalAppointments = () => {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("hospitalToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetchAppointments("PENDING");
  }, []);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchAppointments = async (tab = activeTab) => {
    try {
      setLoading(true);

      const endpoint =
        tab === "PENDING"
          ? `${API_BASE_URL}/api/hospital/appointments/requests`
          : `${API_BASE_URL}/api/hospital/appointments/all`;

      const response = await axios.get(endpoint, getAuthHeaders());

      setAppointments(response.data || []);
    } catch (error) {
      console.log("FETCH APPOINTMENTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch appointment requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    fetchAppointments(tab);
  };

  const acceptAppointment = async (appointmentId) => {
    const confirmAccept = window.confirm(
      "Do you want to accept this appointment?"
    );

    if (!confirmAccept) return;

    try {
      setActionLoadingId(appointmentId);

      const response = await axios.put(
        `${API_BASE_URL}/api/hospital/appointments/${appointmentId}/accept`,
        {},
        getAuthHeaders()
      );

      alert(response.data.message || "Appointment accepted successfully");
      fetchAppointments(activeTab);
    } catch (error) {
      console.log("ACCEPT APPOINTMENT ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to accept appointment"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectAppointment = async (appointmentId) => {
    const rejectionReason = window.prompt(
      "Enter rejection reason:",
      "Doctor is not available at the selected time"
    );

    if (rejectionReason === null) return;

    try {
      setActionLoadingId(appointmentId);

      const response = await axios.put(
        `${API_BASE_URL}/api/hospital/appointments/${appointmentId}/reject`,
        {
          rejectionReason:
            rejectionReason.trim() || "Appointment rejected by hospital",
        },
        getAuthHeaders()
      );

      alert(response.data.message || "Appointment rejected successfully");
      fetchAppointments(activeTab);
    } catch (error) {
      console.log("REJECT APPOINTMENT ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to reject appointment"
      );
    } finally {
      setActionLoadingId(null);
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

  const getStatusClass = (status) => {
    if (!status) return "status-pending";
    return `status-${status.toLowerCase()}`;
  };

  const filteredAppointments =
    activeTab === "ALL"
      ? appointments
      : appointments.filter((appointment) => appointment.status === activeTab);

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  return (
    <div className="hospital-appointments-page">
      <aside className="hospital-appointments-sidebar">
        <div className="hospital-logo">🏥</div>

        <h2>MediLink AI</h2>
        <p>Hospital Admin</p>

        <button onClick={() => navigate("/admin-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="hospital-appointments-main">
        <header className="hospital-appointments-header">
          <div>
            <h1>Appointment Requests</h1>
            <p>
              Review patient appointment requests and approve or reject them.
            </p>
          </div>

          <button
            className="refresh-appointments-btn"
            onClick={() => fetchAppointments(activeTab)}
          >
            Refresh
          </button>
        </header>

        <section className="hospital-appointment-stats">
          <div className="hospital-stat-card">
            <span>Pending Requests</span>
            <h3>{pendingCount}</h3>
          </div>

          <div className="hospital-stat-card">
            <span>Total Loaded</span>
            <h3>{appointments.length}</h3>
          </div>
        </section>

        <section className="hospital-appointment-tabs">
          <button
            className={activeTab === "PENDING" ? "active" : ""}
            onClick={() => changeTab("PENDING")}
          >
            Pending Requests
          </button>

          <button
            className={activeTab === "ALL" ? "active" : ""}
            onClick={() => changeTab("ALL")}
          >
            All Appointments
          </button>
        </section>

        {loading ? (
          <div className="hospital-loading-box">
            Loading appointment requests...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="hospital-empty-box">
            <h3>No appointments found</h3>
            <p>
              Patient appointment requests will appear here once they are
              submitted.
            </p>
          </div>
        ) : (
          <section className="hospital-appointments-grid">
            {filteredAppointments.map((appointment) => (
              <div className="hospital-appointment-card" key={appointment.id}>
                <div className="appointment-card-top">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>{appointment.patientCode}</p>
                  </div>

                  <span className={getStatusClass(appointment.status)}>
                    {appointment.status}
                  </span>
                </div>

                <div className="appointment-details-grid">
                  <div>
                    <span>Doctor</span>
                    <strong>Dr. {appointment.doctorName}</strong>
                  </div>

                  <div>
                    <span>Specialization</span>
                    <strong>{appointment.doctorSpecialization}</strong>
                  </div>

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
                </div>

                <div className="appointment-reason-box">
                  <span>Reason / Symptoms</span>
                  <p>{appointment.reason || "No reason provided"}</p>
                </div>

                {appointment.rejectionReason && (
                  <div className="appointment-rejection-box">
                    <span>Rejection Reason</span>
                    <p>{appointment.rejectionReason}</p>
                  </div>
                )}

                <div className="appointment-meta">
                  <p>
                    <strong>Requested At:</strong>{" "}
                    {appointment.requestedAt
                      ? new Date(appointment.requestedAt).toLocaleString()
                      : "Not available"}
                  </p>

                  {appointment.respondedAt && (
                    <p>
                      <strong>Responded At:</strong>{" "}
                      {new Date(appointment.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {appointment.status === "PENDING" && (
                  <div className="appointment-actions">
                    <button
                      className="accept-appointment-btn"
                      onClick={() => acceptAppointment(appointment.id)}
                      disabled={actionLoadingId === appointment.id}
                    >
                      {actionLoadingId === appointment.id
                        ? "Processing..."
                        : "Accept"}
                    </button>

                    <button
                      className="reject-appointment-btn"
                      onClick={() => rejectAppointment(appointment.id)}
                      disabled={actionLoadingId === appointment.id}
                    >
                      Reject
                    </button>
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

export default HospitalAppointments;