import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/AddDoctor.css";

const AddDoctor = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const hospitalName = localStorage.getItem("hospitalName");
  const hospitalCode = localStorage.getItem("hospitalCode");

  const [doctorData, setDoctorData] = useState({
    doctorName: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
  });

  const [doctors, setDoctors] = useState([]);

  const handleChange = (e) => {
    setDoctorData({
      ...doctorData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/doctor/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctors(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8081/api/doctor/add",
        {
          doctorName: doctorData.doctorName,
          email: doctorData.email,
          phone: doctorData.phone,
          specialization: doctorData.specialization,
          qualification: doctorData.qualification,
          experience: Number(doctorData.experience),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message + "\nDoctor ID: " + response.data.doctorId);

      setDoctorData({
        doctorName: "",
        email: "",
        phone: "",
        specialization: "",
        qualification: "",
        experience: "",
      });

      fetchDoctors();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to add doctor");
    }
  };

  const handleStatusChange = async (doctorId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:8081/api/doctor/${doctorId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      fetchDoctors();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update doctor status");
    }
  };

  const formatStatus = (status) => {
    if (!status) return "AVAILABLE";
    return status.replace("_", " ");
  };

  return (
    <div className="add-doctor-page">
      <aside className="doctor-sidebar">
        <div className="doctor-logo">🏥</div>

        <h2>MediLink AI</h2>
        <p>{hospitalName || "Hospital Admin"}</p>
        <span>{hospitalCode || "Hospital Code"}</span>

        <button onClick={() => navigate("/admin-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="add-doctor-main">
        <header className="add-doctor-header">
          <h1>Doctor Management</h1>
          <p>
            Add doctors, generate doctor IDs, send credentials, and manage
            doctor status.
          </p>
        </header>

        <section className="doctor-form-card">
          <h2>Add Doctor</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Doctor Name</label>
                <input
                  type="text"
                  name="doctorName"
                  value={doctorData.doctorName}
                  onChange={handleChange}
                  placeholder="Dr. Rajesh Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={doctorData.email}
                  onChange={handleChange}
                  placeholder="doctor@gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={doctorData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={doctorData.specialization}
                  onChange={handleChange}
                  placeholder="Cardiologist"
                  required
                />
              </div>

              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={doctorData.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MD"
                  required
                />
              </div>

              <div className="form-group">
                <label>Experience</label>
                <input
                  type="number"
                  name="experience"
                  value={doctorData.experience}
                  onChange={handleChange}
                  placeholder="5"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-doctor-btn">
              Add Doctor & Send Credentials
            </button>
          </form>
        </section>

        <section className="doctor-list-card">
          <h2>Doctors Added</h2>

          {doctors.length === 0 ? (
            <div className="empty-doctor-box">
              <p>No doctors added yet.</p>
            </div>
          ) : (
            <div className="doctor-table">
              <table>
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Edit Status</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td>{doctor.doctorId}</td>
                      <td>{doctor.fullName}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.experience} years</td>

                      <td>
                        <span className={`doctor-status ${doctor.status}`}>
                          {formatStatus(doctor.status)}
                        </span>
                      </td>

                      <td>
                        <select
                          className="status-select"
                          value={doctor.status || "AVAILABLE"}
                          onChange={(e) =>
                            handleStatusChange(doctor.doctorId, e.target.value)
                          }
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="NOT_AVAILABLE">Not Available</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="BUSY">Busy</option>
                          <option value="IN_EMERGENCY">In Emergency</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AddDoctor;