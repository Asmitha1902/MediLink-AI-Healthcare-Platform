import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/PatientDoctorSearch.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const PatientDoctorSearch = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("patientToken");

  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [doctorRefreshLoading, setDoctorRefreshLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/patient-login");
      return;
    }

    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/patient/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctors(response.data);
      return response.data;
    } catch (error) {
      console.log("FETCH DOCTORS ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to fetch doctors"
      );

      return [];
    }
  };

  const formatStatus = (status) => {
    if (!status) return "AVAILABLE";
    return status.replaceAll("_", " ");
  };

  const isDoctorRequestAllowed = (doctor) => {
    if (!doctor?.status) return true;

    return !["NOT_AVAILABLE", "ON_LEAVE", "IN_EMERGENCY"].includes(
      doctor.status
    );
  };

  const getEstimatedWait = (doctor) => {
    const queueCount = Number(doctor?.queueCount || 0);
    const avgWait = Number(doctor?.averageWaitingTime || 0);

    if (queueCount === 0 || avgWait === 0) return 0;

    return queueCount * avgWait;
  };

  const getStatusMessage = (doctor) => {
    if (!doctor?.status || doctor.status === "AVAILABLE") {
      return "Doctor is currently available for appointment request.";
    }

    if (doctor.status === "BUSY") {
      return "Doctor is currently busy, but you can still send an appointment request.";
    }

    if (doctor.status === "NOT_AVAILABLE") {
      return "Doctor is currently not available. Appointment request is disabled.";
    }

    if (doctor.status === "ON_LEAVE") {
      return "Doctor is on leave. Appointment request is disabled.";
    }

    if (doctor.status === "IN_EMERGENCY") {
      return "Doctor is handling emergency cases. Appointment request is disabled.";
    }

    return "Check doctor availability before sending request.";
  };

  const openAppointmentModal = async (doctor) => {
    try {
      setDoctorRefreshLoading(true);

      const latestDoctors = await fetchDoctors();

      const latestDoctor =
        latestDoctors.find((d) => d.id === doctor.id) ||
        latestDoctors.find((d) => d.doctorId === doctor.doctorId) ||
        doctor;

      setSelectedDoctor(latestDoctor);
      setAppointmentDate("");
      setAppointmentTime("");
      setReason("");
      setShowAppointmentModal(true);
    } finally {
      setDoctorRefreshLoading(false);
    }
  };

  const closeAppointmentModal = () => {
    setShowAppointmentModal(false);
    setSelectedDoctor(null);
    setAppointmentDate("");
    setAppointmentTime("");
    setReason("");
  };

  const refreshSelectedDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      setDoctorRefreshLoading(true);

      const latestDoctors = await fetchDoctors();

      const latestDoctor =
        latestDoctors.find((d) => d.id === selectedDoctor.id) ||
        latestDoctors.find((d) => d.doctorId === selectedDoctor.doctorId);

      if (latestDoctor) {
        setSelectedDoctor(latestDoctor);
      }
    } finally {
      setDoctorRefreshLoading(false);
    }
  };

  const submitAppointmentRequest = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      alert("Please select a doctor");
      return;
    }

    if (!isDoctorRequestAllowed(selectedDoctor)) {
      alert("This doctor is currently not available for appointment request");
      return;
    }

    if (!appointmentDate || !appointmentTime || !reason.trim()) {
      alert("Please select date, time and enter reason");
      return;
    }

    try {
      setAppointmentLoading(true);

      const doctorDbId = selectedDoctor.id;

      if (!doctorDbId) {
        alert("Doctor database ID missing. Please add id in doctor list API.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/patient/appointments/request/${doctorDbId}`,
        {
          appointmentDate,
          appointmentTime,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || "Appointment request sent successfully");
      closeAppointmentModal();
    } catch (error) {
      console.log("APPOINTMENT REQUEST ERROR:", error);
      console.log("BACKEND RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to send appointment request"
      );
    } finally {
      setAppointmentLoading(false);
    }
  };

  const specializations = [
    "ALL",
    ...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean)),
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      doctor.doctorName?.toLowerCase().includes(search) ||
      doctor.specialization?.toLowerCase().includes(search) ||
      doctor.hospitalName?.toLowerCase().includes(search) ||
      doctor.city?.toLowerCase().includes(search);

    const matchesSpecialization =
      selectedSpecialization === "ALL" ||
      doctor.specialization === selectedSpecialization;

    const matchesStatus =
      selectedStatus === "ALL" || doctor.status === selectedStatus;

    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  return (
    <div className="doctor-search-page">
      <aside className="doctor-search-sidebar">
        <div className="doctor-search-logo">👤</div>

        <h2>MediLink AI</h2>
        <p>Patient Portal</p>

        <button onClick={() => navigate("/patient-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="doctor-search-main">
        <header className="doctor-search-header">
          <div>
            <h1>Search Doctors</h1>
            <p>
              Find doctors by name, specialization, hospital, location, and
              availability.
            </p>
          </div>

          <button className="refresh-doctors-btn" onClick={fetchDoctors}>
            Refresh Availability
          </button>
        </header>

        <section className="doctor-search-filters">
          <input
            type="text"
            placeholder="Search doctor, hospital, specialization, city..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            {specializations.map((specialization) => (
              <option key={specialization} value={specialization}>
                {specialization === "ALL"
                  ? "All Specializations"
                  : specialization}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="NOT_AVAILABLE">Not Available</option>
            <option value="BUSY">Busy</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="IN_EMERGENCY">In Emergency</option>
          </select>
        </section>

        <section className="doctor-search-grid">
          {filteredDoctors.length === 0 ? (
            <div className="doctor-empty-box">
              <p>No doctors found.</p>
              <span>Try changing search or filter options.</span>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div className="doctor-card" key={doctor.id || doctor.doctorId}>
                <div className="doctor-card-top">
                  <div className="doctor-avatar">👨‍⚕️</div>

                  <div>
                    <h3>{doctor.doctorName}</h3>
                    <p>{doctor.specialization}</p>
                  </div>
                </div>

                <span className={`doctor-status ${doctor.status}`}>
                  {formatStatus(doctor.status)}
                </span>

                <div className="doctor-live-box">
                  <div>
                    <strong>Current Queue</strong>
                    <span>{doctor.queueCount || 0}</span>
                  </div>

                  <div>
                    <strong>Avg Wait</strong>
                    <span>{doctor.averageWaitingTime || 0} mins</span>
                  </div>

                  <div>
                    <strong>Estimated Wait</strong>
                    <span>{getEstimatedWait(doctor)} mins</span>
                  </div>
                </div>

                <div className="doctor-info-list">
                  <p>
                    <strong>Doctor ID:</strong> {doctor.doctorId}
                  </p>

                  <p>
                    <strong>Hospital:</strong> {doctor.hospitalName}
                  </p>

                  <p>
                    <strong>City:</strong> {doctor.city}
                  </p>

                  <p>
                    <strong>Qualification:</strong>{" "}
                    {doctor.qualification || "Not Provided"}
                  </p>

                  <p>
                    <strong>Experience:</strong> {doctor.experience || 0} years
                  </p>
                </div>

                <button
                  className="book-btn"
                  onClick={() => openAppointmentModal(doctor)}
                  disabled={doctorRefreshLoading}
                >
                  {doctorRefreshLoading ? "Checking..." : "Request Appointment"}
                </button>
              </div>
            ))
          )}
        </section>
      </main>

      {showAppointmentModal && selectedDoctor && (
        <div className="appointment-modal-overlay">
          <div className="appointment-modal">
            <button
              className="appointment-modal-close"
              onClick={closeAppointmentModal}
            >
              ×
            </button>

            <h2>Request Appointment</h2>

            <div className="selected-doctor-box">
              <h3>Dr. {selectedDoctor.doctorName}</h3>
              <p>{selectedDoctor.specialization}</p>
              <span>{selectedDoctor.hospitalName}</span>
            </div>

            <div className="doctor-current-status-box">
              <div className="status-row">
                <span>Current Status</span>
                <strong className={`modal-status ${selectedDoctor.status}`}>
                  {formatStatus(selectedDoctor.status)}
                </strong>
              </div>

              <div className="status-grid">
                <div>
                  <span>Queue Count</span>
                  <strong>{selectedDoctor.queueCount || 0}</strong>
                </div>

                <div>
                  <span>Avg Waiting</span>
                  <strong>{selectedDoctor.averageWaitingTime || 0} mins</strong>
                </div>

                <div>
                  <span>Estimated Wait</span>
                  <strong>{getEstimatedWait(selectedDoctor)} mins</strong>
                </div>
              </div>

              <p className="availability-message">
                {getStatusMessage(selectedDoctor)}
              </p>

              <button
                type="button"
                className="refresh-selected-doctor-btn"
                onClick={refreshSelectedDoctor}
                disabled={doctorRefreshLoading}
              >
                {doctorRefreshLoading ? "Refreshing..." : "Refresh Live Status"}
              </button>
            </div>

            <form onSubmit={submitAppointmentRequest}>
              <div className="appointment-form-group">
                <label>Preferred Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="appointment-form-group">
                <label>Preferred Time</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>

              <div className="appointment-form-group">
                <label>Reason / Symptoms</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter your symptoms or reason for appointment"
                  rows="4"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-appointment-btn"
                disabled={
                  appointmentLoading || !isDoctorRequestAllowed(selectedDoctor)
                }
              >
                {appointmentLoading ? "Sending..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDoctorSearch;