import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientRecords.css";

const PatientRecords = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("patientToken");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchReports();
  }, [token, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:8081/api/patient/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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

  const reportTypes = [
    "ALL",
    ...new Set(reports.map((report) => report.reportType).filter(Boolean)),
  ];

  const filteredReports = reports.filter((report) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      report.reportTitle?.toLowerCase().includes(search) ||
      report.reportType?.toLowerCase().includes(search) ||
      report.description?.toLowerCase().includes(search) ||
      report.fileName?.toLowerCase().includes(search);

    const matchesType =
      selectedType === "ALL" || report.reportType === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="patient-records-page">
      <aside className="patient-records-sidebar">
        <div className="patient-records-logo">📄</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="patient-records-main">
        <header className="patient-records-header">
          <div>
            <h1>Medical Records</h1>
            <p>Search, view, download, and manage uploaded reports.</p>
          </div>

          <button
            className="add-report-btn"
            onClick={() => navigate("/patient/upload-report")}
          >
            + Upload Report
          </button>
        </header>

        <section className="records-search-card">
          <input
            type="text"
            placeholder="Search by title, type, description, or file name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All Report Types" : type}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="records-empty-box">
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="records-empty-box">
            <p>No reports uploaded yet.</p>
            <span>Upload your first medical report.</span>

            <button onClick={() => navigate("/patient/upload-report")}>
              Upload Report
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="records-empty-box">
            <p>No matching reports found.</p>
            <span>Try changing search text or report type.</span>
          </div>
        ) : (
          <section className="records-grid">
            {filteredReports.map((report) => (
              <div className="record-card" key={report.reportId}>
                <div className="record-card-top">
                  <div className="record-icon">📄</div>

                  <div>
                    <h3>{report.reportTitle}</h3>
                    <p>{report.reportType}</p>
                  </div>
                </div>

                <div className="record-info">
                  <p>
                    <strong>Description:</strong>{" "}
                    {report.description || "No description added"}
                  </p>

                  <p>
                    <strong>File:</strong> {report.fileName}
                  </p>

                  <p>
                    <strong>File Type:</strong> {report.fileType}
                  </p>

                  <p>
                    <strong>Uploaded At:</strong>{" "}
                    {formatDate(report.uploadedAt)}
                  </p>
                </div>

                <div className="record-actions">
                  <button
                    className="view-report-btn"
                    onClick={() => setSelectedReport(report)}
                  >
                    View Report
                  </button>

                  <button
                    className="download-report-btn"
                    onClick={() => downloadReport(report)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {selectedReport && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <div>
                <h2>{selectedReport.reportTitle}</h2>
                <p>{selectedReport.fileName}</p>
              </div>

              <div className="report-modal-actions">
                <button
                  className="modal-download-btn"
                  onClick={() => downloadReport(selectedReport)}
                >
                  Download
                </button>

                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="report-preview-box">
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
                <div className="unsupported-preview">
                  <p>Preview not available for this file type.</p>

                  <button
                    className="download-report-btn"
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

export default PatientRecords;