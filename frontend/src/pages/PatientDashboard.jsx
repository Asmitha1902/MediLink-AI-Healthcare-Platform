import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081";

const PatientDashboard = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("patientToken");

  const patientId = localStorage.getItem("patientId");
  const patientName = localStorage.getItem("fullName");
  const patientEmail = localStorage.getItem("userEmail");
  const patientPhone = localStorage.getItem("userPhone");
  const userRole = localStorage.getItem("userRole");

  const [reportCount, setReportCount] = useState(0);
  const [recentReports, setRecentReports] = useState([]);

  const [doctorsConsultedCount, setDoctorsConsultedCount] = useState(0);
  const [activeQrCount, setActiveQrCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [recentAccessRequests, setRecentAccessRequests] = useState([]);

  const [appointmentCount, setAppointmentCount] = useState(0);
  const [pendingAppointmentCount, setPendingAppointmentCount] = useState(0);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchReports();
    fetchShareHistory();
    fetchAccessRequests();
    fetchAppointments();
  }, [token, navigate]);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patient/reports`,
        getAuthConfig()
      );

      const sortedReports = response.data.sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );

      setReportCount(sortedReports.length);
      setRecentReports(sortedReports.slice(0, 2));
    } catch (error) {
      console.log("FETCH REPORTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setReportCount(0);
      setRecentReports([]);
    }
  };

  const fetchShareHistory = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patient/share/history`,
        getAuthConfig()
      );

      const activeQrList = response.data.filter((item) => {
        const isActive = item.active === true;
        const isNotExpired =
          item.expired === false || new Date(item.expiresAt) > new Date();

        return isActive && isNotExpired;
      });

      setActiveQrCount(activeQrList.length);
    } catch (error) {
      console.log("FETCH SHARE HISTORY ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setActiveQrCount(0);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patient/access-requests`,
        getAuthConfig()
      );

      const sortedRequests = response.data.sort(
        (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
      );

      const pendingRequests = sortedRequests.filter(
        (request) => request.status === "PENDING"
      );

      const approvedRequests = sortedRequests.filter(
        (request) => request.status === "APPROVED"
      );

      const uniqueApprovedDoctors = new Set(
        approvedRequests.map(
          (request) =>
            request.doctorId ||
            request.doctorEmail ||
            request.doctorName ||
            request.requestId
        )
      );

      setPendingRequestCount(pendingRequests.length);
      setDoctorsConsultedCount(uniqueApprovedDoctors.size);
      setRecentAccessRequests(sortedRequests.slice(0, 2));
    } catch (error) {
      console.log("FETCH ACCESS REQUESTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setPendingRequestCount(0);
      setDoctorsConsultedCount(0);
      setRecentAccessRequests([]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patient/appointments/my`,
        getAuthConfig()
      );

      const sortedAppointments = response.data.sort(
        (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
      );

      const pendingAppointments = sortedAppointments.filter(
        (appointment) => appointment.status === "PENDING"
      );

      setAppointmentCount(sortedAppointments.length);
      setPendingAppointmentCount(pendingAppointments.length);
      setRecentAppointments(sortedAppointments.slice(0, 2));
    } catch (error) {
      console.log("FETCH APPOINTMENTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setAppointmentCount(0);
      setPendingAppointmentCount(0);
      setRecentAppointments([]);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not Available";
    }

    return new Date(dateValue).toLocaleString();
  };

  const formatAppointmentDate = (dateValue) => {
    if (!dateValue) return "Not Available";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAppointmentTime = (timeValue) => {
    if (!timeValue) return "Not Available";
    return timeValue.slice(0, 5);
  };

  const getStatusClass = (status) => {
    if (status === "APPROVED") {
      return "dashboard-status-approved";
    }

    if (status === "REJECTED") {
      return "dashboard-status-rejected";
    }

    return "dashboard-status-pending";
  };

  const getAppointmentStatusClass = (status) => {
    if (status === "ACCEPTED") {
      return "dashboard-status-approved";
    }

    if (status === "REJECTED" || status === "CANCELLED") {
      return "dashboard-status-rejected";
    }

    if (status === "COMPLETED") {
      return "dashboard-status-completed";
    }

    return "dashboard-status-pending";
  };

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userRole");

    navigate("/patient-login");
  };

  return (
    <div className="patient-dashboard">
      <aside className="patient-sidebar">
        <div className="patient-logo-box">
          <div className="patient-logo">👤</div>
          <h2>MediLink AI</h2>
          <p>Patient Portal</p>
        </div>

        <nav className="patient-nav">
          <button className="active">Dashboard</button>

          <button onClick={() => navigate("/patient/records")}>
            Medical Records
          </button>

          <button onClick={() => navigate("/patient/upload-report")}>
            Upload Report
          </button>

          <button onClick={() => navigate("/patient/doctors")}>
            Doctor Search
          </button>

          <button onClick={() => navigate("/patient/appointments")}>
            My Appointments
          </button>

          <button onClick={() => navigate("/patient/qr-sharing")}>
            QR Sharing
          </button>

          <button onClick={() => navigate("/patient/access-requests")}>
            Access Requests
          </button>

          <button onClick={() => navigate("/patient/shared-history")}>
            Shared History
          </button>
        </nav>

        <button className="patient-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="patient-main">
        <header className="patient-header">
          <div>
            <h1>Patient Dashboard</h1>
            <p>
              Manage your medical records, doctor appointments, QR sharing, and
              health history.
            </p>
          </div>

          <div className="patient-profile-card">
            <p>Logged in as</p>
            <h4>{patientName || patientEmail || patientPhone || "Patient"}</h4>
            <span>{userRole || "ROLE_PATIENT"}</span>
          </div>
        </header>

        <section className="patient-info-card">
          <div>
            <p>Patient ID</p>
            <h3>{patientId || "Not Available"}</h3>
          </div>

          <div>
            <p>Email</p>
            <h3>{patientEmail || "Not Provided"}</h3>
          </div>

          <div>
            <p>Phone</p>
            <h3>{patientPhone || "Not Available"}</h3>
          </div>
        </section>

        <section className="patient-stats-grid">
          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/records")}
          >
            <div className="stat-icon">📄</div>
            <h3>{reportCount}</h3>
            <p>Medical Reports</p>
          </div>

          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/appointments")}
          >
            <div className="stat-icon">📅</div>
            <h3>{appointmentCount}</h3>
            <p>My Appointments</p>
          </div>

          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/appointments")}
          >
            <div className="stat-icon">⏳</div>
            <h3>{pendingAppointmentCount}</h3>
            <p>Pending Appointments</p>
          </div>

          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/access-requests")}
          >
            <div className="stat-icon">👨‍⚕️</div>
            <h3>{doctorsConsultedCount}</h3>
            <p>Doctors Consulted</p>
          </div>

          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/shared-history")}
          >
            <div className="stat-icon">🔐</div>
            <h3>{activeQrCount}</h3>
            <p>Active QR Access</p>
          </div>

          <div
            className="patient-stat-card"
            onClick={() => navigate("/patient/access-requests")}
          >
            <div className="stat-icon">🔔</div>
            <h3>{pendingRequestCount}</h3>
            <p>Pending Access Requests</p>
          </div>
        </section>

        <section className="patient-actions-section">
          <h2>Quick Actions</h2>

          <div className="patient-action-grid">
            <div className="patient-action-card">
              <div className="action-icon">📤</div>

              <h3>Upload Medical Report</h3>

              <p>
                Upload lab reports, prescriptions, X-rays, MRI scans, and
                diagnosis reports.
              </p>

              <button onClick={() => navigate("/patient/upload-report")}>
                Upload Report
              </button>
            </div>

            <div className="patient-action-card">
              <div className="action-icon">🔎</div>

              <h3>Search Doctors</h3>

              <p>
                Search doctors by name, specialization, hospital, location, and
                availability.
              </p>

              <button onClick={() => navigate("/patient/doctors")}>
                Search Doctor
              </button>
            </div>

            <div className="patient-action-card">
              <div className="action-icon">📅</div>

              <h3>My Appointments</h3>

              <p>
                Track appointment requests, hospital approval status, and
                consultation updates.
              </p>

              <button onClick={() => navigate("/patient/appointments")}>
                View Appointments
              </button>
            </div>

            <div className="patient-action-card">
              <div className="action-icon">📱</div>

              <h3>Generate QR Access</h3>

              <p>
                Generate secure QR access for doctors with time limit and
                selected records.
              </p>

              <button onClick={() => navigate("/patient/qr-sharing")}>
                Generate QR
              </button>
            </div>
          </div>
        </section>

        <section className="patient-bottom-grid">
          <div className="patient-section-card">
            <div className="patient-section-title-row">
              <h2>Recent Reports</h2>

              <button onClick={() => navigate("/patient/records")}>
                View All
              </button>
            </div>

            {recentReports.length === 0 ? (
              <div className="patient-empty-box">
                <p>No reports uploaded yet.</p>
                <span>Your uploaded medical reports will appear here.</span>
              </div>
            ) : (
              <div className="patient-recent-report-list">
                {recentReports.map((report) => (
                  <div
                    className="patient-recent-report-item"
                    key={report.reportId}
                    onClick={() => navigate("/patient/records")}
                  >
                    <div>📄</div>

                    <div>
                      <h4>{report.reportTitle}</h4>
                      <p>{report.reportType}</p>
                      <span>{formatDate(report.uploadedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="patient-section-card">
            <div className="patient-section-title-row">
              <h2>Recent Appointments</h2>

              <button onClick={() => navigate("/patient/appointments")}>
                View All
              </button>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="patient-empty-box">
                <p>No appointments yet.</p>
                <span>Your appointment requests will appear here.</span>
              </div>
            ) : (
              <div className="dashboard-access-list">
                {recentAppointments.map((appointment) => (
                  <div
                    className="dashboard-access-item"
                    key={appointment.id}
                    onClick={() => navigate("/patient/appointments")}
                  >
                    <div className="dashboard-access-avatar">📅</div>

                    <div className="dashboard-access-info">
                      <h4>Dr. {appointment.doctorName}</h4>

                      <p>
                        {formatAppointmentDate(appointment.appointmentDate)} at{" "}
                        {formatAppointmentTime(appointment.appointmentTime)}
                      </p>

                      <span>{appointment.hospitalName}</span>
                    </div>

                    <span className={getAppointmentStatusClass(appointment.status)}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="patient-section-card">
            <div className="patient-section-title-row">
              <h2>Access Requests</h2>

              <button onClick={() => navigate("/patient/access-requests")}>
                View All
              </button>
            </div>

            {recentAccessRequests.length === 0 ? (
              <div className="patient-empty-box">
                <p>No access requests yet.</p>
                <span>Doctor access requests will appear here.</span>
              </div>
            ) : (
              <div className="dashboard-access-list">
                {recentAccessRequests.map((request) => (
                  <div
                    className="dashboard-access-item"
                    key={request.requestId}
                    onClick={() => navigate("/patient/access-requests")}
                  >
                    <div className="dashboard-access-avatar">👨‍⚕️</div>

                    <div className="dashboard-access-info">
                      <h4>{request.doctorName}</h4>

                      <p>
                        Wants access to {request.selectedReportsCount || 0}{" "}
                        report
                        {(request.selectedReportsCount || 0) > 1 ? "s" : ""}
                      </p>

                      <span>{formatDate(request.requestedAt)}</span>
                    </div>

                    <span className={getStatusClass(request.status)}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;