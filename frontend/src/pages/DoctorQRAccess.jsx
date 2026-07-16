import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import "../assets/styles/DoctorQRAccess.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081";

const DoctorQRAccess = () => {
  const navigate = useNavigate();
  const { accessToken } = useParams();

  const doctorToken = localStorage.getItem("doctorToken");

  const cameraScannerRef = useRef(null);
  const requestSentRef = useRef(false);

  const [currentAccessToken, setCurrentAccessToken] = useState(
    accessToken || ""
  );

  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [reportsData, setReportsData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (accessToken) {
      setCurrentAccessToken(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
  if (!currentAccessToken) return;

  if (!doctorToken) {
    localStorage.setItem("pendingQrAccessToken", currentAccessToken);
    navigate("/doctor-login");
    return;
  }

  // Prevent duplicate request
  if (requestSentRef.current) return;

  requestSentRef.current = true;

  sendAccessRequest(currentAccessToken);
}, [currentAccessToken]);

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const extractAccessTokenFromQr = (qrText) => {
    if (!qrText) {
      return "";
    }

    const cleanText = qrText.trim();

    try {
      const url = new URL(cleanText);
      const parts = url.pathname.split("/").filter(Boolean);

      const qrIndex = parts.indexOf("qr-access");

      if (qrIndex !== -1 && parts[qrIndex + 1]) {
        return parts[qrIndex + 1];
      }

      const oldIndex = parts.indexOf("shared-records");

      if (oldIndex !== -1 && parts[oldIndex + 1]) {
        return parts[oldIndex + 1];
      }
    } catch (error) {
      // QR may contain only token
    }

    const parts = cleanText.split("/").filter(Boolean);

    const qrIndex = parts.indexOf("qr-access");

    if (qrIndex !== -1 && parts[qrIndex + 1]) {
      return parts[qrIndex + 1];
    }

    const oldIndex = parts.indexOf("shared-records");

    if (oldIndex !== -1 && parts[oldIndex + 1]) {
      return parts[oldIndex + 1];
    }

    return cleanText.split("?")[0].split("#")[0];
  };

  const handleQrResult = async (qrText) => {
  const token = extractAccessTokenFromQr(qrText);

  if (!token) {
    alert("Invalid QR code");
    return;
  }

  await stopCameraScanner();

  setReportsData(null);
  setRequestMessage("");

  // Don't set state here
  navigate(`/qr-access/${token}`);
};

  const startCameraScanner = async () => {
    try {
      setRequestMessage("");

      const scanner = new Html5Qrcode("doctor-qr-reader");
      cameraScannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await handleQrResult(decodedText);
        }
      );

      setCameraActive(true);
    } catch (error) {
      console.log("CAMERA QR ERROR:", error);
      alert("Unable to open camera. Please allow camera permission.");
    }
  };

  const stopCameraScanner = async () => {
    try {
      if (cameraScannerRef.current) {
        await cameraScannerRef.current.stop();
        cameraScannerRef.current.clear();
        cameraScannerRef.current = null;
      }
    } catch (error) {
      console.log("STOP CAMERA ERROR:", error);
    } finally {
      setCameraActive(false);
    }
  };

  const uploadQrImage = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    try {
      const scanner = new Html5Qrcode("doctor-qr-upload-reader");

      const decodedText = await scanner.scanFile(file, true);

      scanner.clear();

      await handleQrResult(decodedText);
    } catch (error) {
      console.log("UPLOAD QR ERROR:", error);
      alert(
        "Could not read QR from uploaded image. Please upload a clear QR image."
      );
    } finally {
      e.target.value = "";
    }
  };

  const sendAccessRequest = async (tokenValue = currentAccessToken) => {
    if (!tokenValue) {
      alert("Please scan or upload QR first");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/access/request/${tokenValue}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${doctorToken}`,
          },
        }
      );

      setRequestMessage(response.data.message);
    } catch (error) {
      console.log("ACCESS REQUEST ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setRequestMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to send access request"
      );
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalAndViewReports = async () => {
    if (!currentAccessToken) {
      alert("Please scan or upload QR first");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/access/reports/${currentAccessToken}`,
        {
          headers: {
            Authorization: `Bearer ${doctorToken}`,
          },
        }
      );

      setReportsData(response.data);
      setRequestMessage("Patient approved your request. Reports are available.");
    } catch (error) {
      console.log("VIEW REPORTS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Patient approval is still pending"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report) => {
    const downloadUrl = report.downloadUrl || report.fileUrl;

    if (!downloadUrl) {
      alert("Download link not available");
      return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = report.fileName || "medical-report";
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scanAnotherQr = async () => {
    await stopCameraScanner();

    setCurrentAccessToken("");
    setRequestMessage("");
    setReportsData(null);
    setSelectedReport(null);
    requestSentRef.current = false;

    navigate("/doctor/qr-access");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not Available";
    }

    return new Date(dateValue).toLocaleString();
  };

  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith("image/");
  };

  const isPdfFile = (fileType) => {
    return fileType === "application/pdf";
  };

  return (
    <div className="doctor-qr-page">
      <header className="doctor-qr-header">
        <div>
          <h1>MediLink AI</h1>
          <p>Doctor Secure QR Access</p>
        </div>

        <button onClick={() => navigate("/doctor-dashboard")}>
          Doctor Dashboard
        </button>
      </header>

      <main className="doctor-qr-main">
        {!currentAccessToken ? (
          <section className="doctor-scan-card">
            <div className="doctor-request-icon">📷</div>

            <h2>Scan Patient QR</h2>

            <p>
              Scan QR using camera or upload QR image to request patient report
              access.
            </p>

            <div id="doctor-qr-reader" className="doctor-qr-reader"></div>

            <div
              id="doctor-qr-upload-reader"
              className="hidden-qr-reader"
            ></div>

            <div className="doctor-scan-actions">
              {!cameraActive ? (
                <button onClick={startCameraScanner}>
                  Scan QR Using Camera
                </button>
              ) : (
                <button className="stop-btn" onClick={stopCameraScanner}>
                  Stop Scanner
                </button>
              )}

              <label className="upload-qr-btn">
                Upload QR Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadQrImage}
                  hidden
                />
              </label>
            </div>
          </section>
        ) : !reportsData ? (
          <section className="doctor-request-card">
            <div className="doctor-request-icon">🔐</div>

            <h2>Patient Report Access Request</h2>

            {loading ? (
              <p>Processing request...</p>
            ) : (
              <p>{requestMessage || "Sending access request to patient..."}</p>
            )}

            <div className="doctor-token-box">
              <p>
                <strong>QR Token:</strong> {currentAccessToken}
              </p>
            </div>

            <div className="doctor-request-info">
              <p>
                This QR code does not open reports directly. Patient approval is
                required before viewing medical records.
              </p>
            </div>

            <div className="doctor-request-actions">
              <button
                onClick={() => sendAccessRequest(currentAccessToken)}
                disabled={loading}
              >
                Send Request Again
              </button>

              <button
                className="check-btn"
                onClick={checkApprovalAndViewReports}
                disabled={loading}
              >
                Check Approval & View Reports
              </button>

              <button className="scan-another-btn" onClick={scanAnotherQr}>
                Scan Another QR
              </button>
            </div>
          </section>
        ) : (
          <section className="doctor-reports-section">
            <div className="doctor-patient-card">
              <div>
                <p>Patient ID</p>
                <h3>{reportsData.patientId}</h3>
              </div>

              <div>
                <p>Patient Name</p>
                <h3>{reportsData.patientName}</h3>
              </div>

              <div>
                <p>Reports Shared</p>
                <h3>{reportsData.reportsCount}</h3>
              </div>
            </div>

            <div className="doctor-reports-title-row">
              <h2>Approved Medical Reports</h2>

              <button onClick={scanAnotherQr}>Scan Another QR</button>
            </div>

            <div className="doctor-reports-grid">
              {reportsData.reports.map((report) => (
                <div className="doctor-report-card" key={report.reportId}>
                  <div className="doctor-report-top">
                    <div>📄</div>

                    <div>
                      <h3>{report.reportTitle}</h3>
                      <p>{report.reportType}</p>
                    </div>
                  </div>

                  <div className="doctor-report-info">
                    <p>
                      <strong>Description:</strong>{" "}
                      {report.description || "No description added"}
                    </p>

                    <p>
                      <strong>File:</strong> {report.fileName}
                    </p>

                    <p>
                      <strong>Uploaded At:</strong>{" "}
                      {formatDate(report.uploadedAt)}
                    </p>
                  </div>

                  <div className="doctor-report-actions">
                    <button onClick={() => setSelectedReport(report)}>
                      View Report
                    </button>

                    <button
                      className="doctor-download-btn"
                      onClick={() => downloadReport(report)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {selectedReport && (
        <div className="doctor-report-modal-overlay">
          <div className="doctor-report-modal">
            <div className="doctor-report-modal-header">
              <div>
                <h2>{selectedReport.reportTitle}</h2>
                <p>{selectedReport.fileName}</p>
              </div>

              <div className="doctor-modal-actions">
                <button
                  className="doctor-modal-download-btn"
                  onClick={() => downloadReport(selectedReport)}
                >
                  Download
                </button>

                <button
                  className="doctor-modal-close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="doctor-report-preview">
              {isImageFile(selectedReport.fileType) ? (
                <img
                  src={selectedReport.fileUrl}
                  alt={selectedReport.reportTitle}
                />
              ) : isPdfFile(selectedReport.fileType) ? (
                <iframe
                  src={selectedReport.fileUrl}
                  title={selectedReport.reportTitle}
                ></iframe>
              ) : (
                <div className="doctor-unsupported-box">
                  <p>Preview not available for this file type.</p>

                  <button
                    className="doctor-download-btn unsupported-download-btn"
                    onClick={() => downloadReport(selectedReport)}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorQRAccess;