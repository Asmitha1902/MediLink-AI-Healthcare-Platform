import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientAccessRequests.css";

const PatientAccessRequests = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("patientToken");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchRequests();
  }, [token, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:8081/api/patient/access-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRequests(response.data);
    } catch (error) {
      console.log("FETCH REQUESTS ERROR:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch access requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const response = await axios.put(
        `http://localhost:8081/api/patient/access-requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      fetchRequests();
    } catch (error) {
      console.log("APPROVE ERROR:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to approve request"
      );
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const response = await axios.put(
        `http://localhost:8081/api/patient/access-requests/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      fetchRequests();
    } catch (error) {
      console.log("REJECT ERROR:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to reject request"
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not Available";
    }

    return new Date(date).toLocaleString();
  };

  const getStatusClass = (status) => {
    if (status === "APPROVED") {
      return "status-approved";
    }

    if (status === "REJECTED") {
      return "status-rejected";
    }

    return "status-pending";
  };

  return (
    <div className="patient-access-page">
      <aside className="access-sidebar">
        <div className="access-logo">🔔</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="access-main">
        <header className="access-header">
          <div>
            <h1>Access Requests</h1>
            <p>Approve or reject doctor access requests.</p>
          </div>

          <button onClick={fetchRequests}>Refresh</button>
        </header>

        {loading ? (
          <div className="access-empty-box">
            <p>Loading access requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="access-empty-box">
            <div>🔐</div>
            <p>No access requests yet.</p>
            <span>
              When a doctor scans your QR and requests access, it will appear
              here.
            </span>
          </div>
        ) : (
          <section className="access-request-grid">
            {requests.map((request) => (
              <div className="access-request-card" key={request.requestId}>
                <div className="request-top">
                  <div className="doctor-avatar">👨‍⚕️</div>

                  <div>
                    <h3>{request.doctorName}</h3>
                    <p>{request.specialization}</p>
                  </div>

                  <span className={getStatusClass(request.status)}>
                    {request.status}
                  </span>
                </div>

                <div className="request-message">
                  <p>
                    <strong>{request.doctorName}</strong> wants to access your
                    selected medical reports.
                  </p>
                </div>

                <div className="request-details">
                  <p>
                    <strong>Hospital:</strong> {request.hospitalName}
                  </p>

                  <p>
                    <strong>City:</strong> {request.hospitalCity}
                  </p>

                  <p>
                    <strong>Doctor ID:</strong> {request.doctorId}
                  </p>

                  <p>
                    <strong>Email:</strong> {request.doctorEmail}
                  </p>

                  <p>
                    <strong>Selected Reports:</strong>{" "}
                    {request.selectedReportsCount}
                  </p>

                  <p>
                    <strong>Requested At:</strong>{" "}
                    {formatDate(request.requestedAt)}
                  </p>

                  <p>
                    <strong>QR Expires At:</strong>{" "}
                    {formatDate(request.expiresAt)}
                  </p>
                </div>

                {request.status === "PENDING" ? (
                  <div className="request-actions">
                    <button
                      className="approve-btn"
                      onClick={() => approveRequest(request.requestId)}
                    >
                      Yes, Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => rejectRequest(request.requestId)}
                    >
                      No, Reject
                    </button>
                  </div>
                ) : (
                  <div className="request-response-box">
                    <p>
                      Response: <strong>{request.status}</strong>
                    </p>

                    <span>
                      Responded At: {formatDate(request.respondedAt)}
                    </span>
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

export default PatientAccessRequests;