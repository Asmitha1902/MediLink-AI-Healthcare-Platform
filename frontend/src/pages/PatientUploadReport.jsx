import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientUploadReport.css";

const PatientUploadReport = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("patientToken");

  const [reportData, setReportData] = useState({
    reportTitle: "",
    reportType: "",
    description: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setReportData({
      ...reportData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/patient-login");
      return;
    }

    if (!file) {
      alert("Please select a report file");
      return;
    }

    const formData = new FormData();

    formData.append("reportTitle", reportData.reportTitle);
    formData.append("reportType", reportData.reportType);
    formData.append("description", reportData.description);
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8081/api/patient/reports/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message || "Report uploaded successfully");

      setReportData({
        reportTitle: "",
        reportType: "",
        description: "",
      });

      setFile(null);

      document.getElementById("reportFile").value = "";

      navigate("/patient/records");
    } catch (error) {
      console.log("UPLOAD REPORT ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to upload report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-report-page">
      <aside className="upload-report-sidebar">
        <div className="upload-report-logo">📤</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="upload-report-main">
        <header className="upload-report-header">
          <h1>Upload Medical Report</h1>
          <p>
            Upload lab reports, prescriptions, scans, and diagnosis documents
            securely to AWS S3.
          </p>
        </header>

        <section className="upload-report-card">
          <form onSubmit={handleUploadReport}>
            <div className="form-group">
              <label>Report Title</label>
              <input
                type="text"
                name="reportTitle"
                value={reportData.reportTitle}
                onChange={handleChange}
                placeholder="Example: Blood Test Report"
                required
              />
            </div>

            <div className="form-group">
              <label>Report Type</label>
              <select
                name="reportType"
                value={reportData.reportType}
                onChange={handleChange}
                required
              >
                <option value="">Select Report Type</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Prescription">Prescription</option>
                <option value="X-Ray">X-Ray</option>
                <option value="MRI Scan">MRI Scan</option>
                <option value="CT Scan">CT Scan</option>
                <option value="Blood Test">Blood Test</option>
                <option value="Diagnosis Report">Diagnosis Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={reportData.description}
                onChange={handleChange}
                placeholder="Add short description about this report"
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Upload File</label>
              <input
                id="reportFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              <span className="file-help">
                Allowed: PDF, JPG, PNG, DOC, DOCX
              </span>
            </div>

            {file && (
              <div className="selected-file-box">
                <p>Selected File</p>
                <h4>{file.name}</h4>
              </div>
            )}

            <button type="submit" className="upload-btn" disabled={loading}>
              {loading ? "Uploading..." : "Upload Report"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default PatientUploadReport;