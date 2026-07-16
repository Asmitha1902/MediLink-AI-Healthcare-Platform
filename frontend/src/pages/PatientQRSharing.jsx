import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import "../assets/styles/PatientQRSharing.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081";

const PatientQRSharing = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("patientToken");

  const [reports, setReports] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [expiryMinutes, setExpiryMinutes] = useState(30);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrData, setQrData] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchReports();
  }, [token, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/patient/reports`,
        getAuthConfig()
      );

      const sortedReports = response.data.sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );

      setReports(sortedReports);
    } catch (error) {
      console.log("FETCH REPORTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch reports"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelect = (reportId) => {
    if (selectedReportIds.includes(reportId)) {
      setSelectedReportIds(selectedReportIds.filter((id) => id !== reportId));
    } else {
      setSelectedReportIds([...selectedReportIds, reportId]);
    }
  };

  const generateQR = async () => {
    if (selectedReportIds.length === 0) {
      alert("Please select at least one report");
      return;
    }

    try {
      setGenerating(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/patient/share/generate`,
        {
          reportIds: selectedReportIds,
          expiryMinutes: expiryMinutes,
        },
        getAuthConfig()
      );

      alert(response.data.message);
      setQrData(response.data);
    } catch (error) {
      console.log("GENERATE QR ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to generate QR"
      );
    } finally {
      setGenerating(false);
    }
  };

  const revokeAccess = async () => {
    if (!qrData?.accessId) {
      return;
    }

    const confirmRevoke = window.confirm(
      "Are you sure you want to revoke this QR access?"
    );

    if (!confirmRevoke) {
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/patient/share/revoke/${qrData.accessId}`,
        {},
        getAuthConfig()
      );

      alert(response.data.message);
      setQrData(null);
      setSelectedReportIds([]);
    } catch (error) {
      console.log("REVOKE ACCESS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to revoke access"
      );
    }
  };

  const copyLink = async () => {
    if (!qrData?.accessLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrData.accessLink);
      alert("Access link copied");
    } catch (error) {
      alert("Failed to copy link");
    }
  };

  const createNewQR = () => {
    setQrData(null);
    setSelectedReportIds([]);
    setExpiryMinutes(30);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not Available";
    }

    return new Date(dateValue).toLocaleString();
  };

  const getRemainingTime = () => {
    if (!qrData?.expiresAt) {
      return "Not Available";
    }

    const expiryTime = new Date(qrData.expiresAt);
    const difference = expiryTime - currentTime;

    if (difference <= 0) {
      return "Expired";
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const isQrExpired = () => {
    if (!qrData?.expiresAt) {
      return false;
    }

    return new Date(qrData.expiresAt) <= currentTime;
  };

  return (
    <div className="qr-sharing-page">
      <aside className="qr-sidebar">
        <div className="qr-logo">📱</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="qr-main">
        <header className="qr-header">
          <div>
            <h1>QR Sharing</h1>
            <p>
              Select medical reports and generate a secure time-limited QR code.
            </p>
          </div>

          <button onClick={() => navigate("/patient/records")}>
            View Records
          </button>
        </header>

        <section className="qr-content-grid">
          <div className="qr-left-card">
            <h2>Select Reports</h2>

            {loading ? (
              <div className="qr-empty-box">
                <p>Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="qr-empty-box">
                <p>No reports uploaded yet.</p>
                <span>Upload reports first to generate QR access.</span>

                <button onClick={() => navigate("/patient/upload-report")}>
                  Upload Report
                </button>
              </div>
            ) : (
              <div className="qr-report-list">
                {reports.map((report) => (
                  <label className="qr-report-item" key={report.reportId}>
                    <input
                      type="checkbox"
                      checked={selectedReportIds.includes(report.reportId)}
                      onChange={() => handleReportSelect(report.reportId)}
                    />

                    <div>
                      <h3>{report.reportTitle}</h3>
                      <p>{report.reportType}</p>
                      <span>{formatDate(report.uploadedAt)}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="qr-expiry-box">
              <label>QR Access Validity</label>

              <select
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(Number(e.target.value))}
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={1440}>24 Hours</option>
              </select>

              <p>
                After this time, doctor cannot request or view reports using
                this QR.
              </p>
            </div>

            <button
              className="generate-qr-btn"
              onClick={generateQR}
              disabled={
                generating ||
                reports.length === 0 ||
                selectedReportIds.length === 0
              }
            >
              {generating ? "Generating..." : "Generate QR"}
            </button>
          </div>

          <div className="qr-right-card">
            <h2>Generated QR</h2>

            {!qrData ? (
              <div className="qr-empty-preview">
                <div>🔐</div>
                <p>QR code will appear here after generation.</p>
              </div>
            ) : (
              <div className="qr-result-box">
                <h3>QR Generated Successfully</h3>

                <div
                  className={
                    isQrExpired()
                      ? "qr-status-box qr-status-expired"
                      : "qr-status-box qr-status-active"
                  }
                >
                  <strong>{isQrExpired() ? "Expired" : "Active"}</strong>
                  <span>Remaining Time: {getRemainingTime()}</span>
                </div>

                <div className="qr-code-box">
                  <QRCodeCanvas value={qrData.accessLink} size={230} />
                </div>

                <div className="qr-link-box">
                  <label>Access Link</label>
                  <input value={qrData.accessLink} readOnly />
                </div>

                <div className="qr-details">
                  <p>
                    <strong>Selected Reports:</strong>{" "}
                    {qrData.selectedReportsCount}
                  </p>

                  <p>
                    <strong>Validity:</strong>{" "}
                    {qrData.expiryMinutes || expiryMinutes} minutes
                  </p>

                  <p>
                    <strong>Expires At:</strong>{" "}
                    {formatDate(qrData.expiresAt)}
                  </p>
                </div>

                <div className="qr-action-buttons">
                  <button onClick={copyLink}>Copy Link</button>

                  <button
                    onClick={() => window.open(qrData.accessLink, "_blank")}
                    disabled={isQrExpired()}
                  >
                    Open Link
                  </button>

                  <button className="revoke-btn" onClick={revokeAccess}>
                    Revoke Access
                  </button>

                  <button className="new-qr-btn" onClick={createNewQR}>
                    Create New QR
                  </button>
                </div>

                {isQrExpired() && (
                  <div className="qr-expired-note">
                    This QR access time is over. Doctor cannot request or view
                    reports using this QR.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientQRSharing;