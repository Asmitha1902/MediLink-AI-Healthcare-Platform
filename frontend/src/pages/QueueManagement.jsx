import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/QueueManagement.css";

const QueueManagement = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const hospitalName = localStorage.getItem("hospitalName");
  const hospitalCode = localStorage.getItem("hospitalCode");

  const [doctors, setDoctors] = useState([]);
  const [queueInputs, setQueueInputs] = useState({});

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/doctor/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctors(response.data);

      const inputData = {};

      response.data.forEach((doctor) => {
        inputData[doctor.doctorId] = {
          queueCount: doctor.queueCount || 0,
          currentToken: doctor.currentToken || 0,
          averageWaitingTime: doctor.averageWaitingTime || 0,
        };
      });

      setQueueInputs(inputData);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to fetch doctors");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetchDoctors();
  }, []);

  const handleQueueChange = (doctorId, field, value) => {
    setQueueInputs({
      ...queueInputs,
      [doctorId]: {
        ...queueInputs[doctorId],
        [field]: Number(value),
      },
    });
  };

  const handleUpdateQueue = async (doctorId) => {
    try {
      const response = await axios.put(
        `http://localhost:8081/api/doctor/${doctorId}/queue`,
        {
          queueCount: queueInputs[doctorId].queueCount,
          currentToken: queueInputs[doctorId].currentToken,
          averageWaitingTime: queueInputs[doctorId].averageWaitingTime,
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
      alert(error.response?.data?.message || "Failed to update queue");
    }
  };

  const formatStatus = (status) => {
    if (!status) return "AVAILABLE";
    return status.replace("_", " ");
  };

  return (
    <div className="queue-page">
      <aside className="queue-sidebar">
        <div className="queue-logo">🏥</div>

        <h2>MediLink AI</h2>
        <p>{hospitalName || "Hospital Admin"}</p>
        <span>{hospitalCode || "Hospital Code"}</span>

        <button onClick={() => navigate("/admin-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="queue-main">
        <header className="queue-header">
          <h1>Queue Management</h1>
          <p>
            Manage patient queue for each doctor based on specialization and
            current availability.
          </p>
        </header>

        <section className="queue-card">
          <h2>Doctor Wise Queue</h2>

          {doctors.length === 0 ? (
            <div className="queue-empty">
              <p>No doctors added yet.</p>
            </div>
          ) : (
            <div className="queue-table">
              <table>
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Queue Count</th>
                    <th>Current Token</th>
                    <th>Avg Wait Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td>{doctor.doctorId}</td>
                      <td>{doctor.fullName}</td>
                      <td>{doctor.specialization}</td>

                      <td>
                        <span className={`queue-status ${doctor.status}`}>
                          {formatStatus(doctor.status)}
                        </span>
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={queueInputs[doctor.doctorId]?.queueCount || 0}
                          onChange={(e) =>
                            handleQueueChange(
                              doctor.doctorId,
                              "queueCount",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={queueInputs[doctor.doctorId]?.currentToken || 0}
                          onChange={(e) =>
                            handleQueueChange(
                              doctor.doctorId,
                              "currentToken",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={
                            queueInputs[doctor.doctorId]?.averageWaitingTime ||
                            0
                          }
                          onChange={(e) =>
                            handleQueueChange(
                              doctor.doctorId,
                              "averageWaitingTime",
                              e.target.value
                            )
                          }
                        />
                        <span className="mins-text">mins</span>
                      </td>

                      <td>
                        <button
                          className="queue-update-btn"
                          onClick={() => handleUpdateQueue(doctor.doctorId)}
                        >
                          Update
                        </button>
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

export default QueueManagement;