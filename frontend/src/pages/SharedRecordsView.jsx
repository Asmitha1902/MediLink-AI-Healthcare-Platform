import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../assets/styles/SharedRecordsView.css";

const SharedRecordsView = () => {
  const navigate = useNavigate();
  const { accessToken } = useParams();

  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchSharedRecords();
  }, [accessToken]);

  const fetchSharedRecords = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.get(
        `http://localhost:8081/api/shared-records/${accessToken}`
      );

      setSharedData(response.data);
    } catch (error) {
      console.log("SHARED RECORDS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Unable to open shared records"
      );
    } finally {
      setLoading(false);
    }
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
    <div className="shared-records-page">
      <header className="shared-records-header">
        <div>
          <h1>MediLink AI</h1>
          <p>Secure Shared Medical Records</p>
        </div>

        <button onClick={() => navigate("/")}>Home</button>
      </header>

      {loading ? (
        <div className="shared-empty-box">
          <p>Loading shared records...</p>
        </div>
      ) : errorMessage ? (
        <div className="shared-error-box">
          <div>⚠️</div>
          <h2>Access Not Available</h2>
          <p>{errorMessage}</p>
        </div>
      ) : sharedData ? (
        <main className="shared-main">
          <section className="shared-patient-card">
            <div>
              <p>Patient ID</p>
              <h3>{sharedData.patientId}</h3>
            </div>

            <div>
              <p>Patient Name</p>
              <h3>{sharedData.patientName}</h3>
            </div>

            <div>
              <p>Reports Shared</p>
              <h3>{sharedData.reportsCount}</h3>
            </div>

            <div>
              <p>Access Expires At</p>
              <h3>{formatDate(sharedData.expiresAt)}</h3>
            </div>
          </section>

          <section className="shared-reports-section">
            <h2>Shared Reports</h2>

            {sharedData.reports.length === 0 ? (
              <div className="shared-empty-box">
                <p>No reports found in this shared access.</p>
              </div>
            ) : (
              <div className="shared-reports-grid">
                {sharedData.reports.map((report) => (
                  <div className="shared-report-card" key={report.reportId}>
                    <div className="shared-report-top">
                      <div>📄</div>

                      <div>
                        <h3>{report.reportTitle}</h3>
                        <p>{report.reportType}</p>
                      </div>
                    </div>

                    <div className="shared-report-info">
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

                    <button onClick={() => setSelectedReport(report)}>
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      ) : null}

      {selectedReport && (
        <div className="shared-modal-overlay">
          <div className="shared-modal">
            <div className="shared-modal-header">
              <div>
                <h2>{selectedReport.reportTitle}</h2>
                <p>{selectedReport.fileName}</p>
              </div>

              <button onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            <div className="shared-preview-box">
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
                <div className="shared-unsupported-box">
                  <p>Preview not available for this file type.</p>

                  <a
                    href={selectedReport.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedRecordsView;