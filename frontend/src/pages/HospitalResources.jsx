import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/HospitalResources.css";

const HospitalResources = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const hospitalName = localStorage.getItem("hospitalName");
  const hospitalCode = localStorage.getItem("hospitalCode");

  const [resources, setResources] = useState({
    icuBeds: 0,
    generalBeds: 0,
    emergencyBeds: 0,
    ventilators: 0,
    ambulances: 0,
    oxygenCylinders: 0,
    bloodUnits: 0,
  });

  const fetchResources = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8081/api/hospital/resources",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResources({
        icuBeds: response.data.icuBeds || 0,
        generalBeds: response.data.generalBeds || 0,
        emergencyBeds: response.data.emergencyBeds || 0,
        ventilators: response.data.ventilators || 0,
        ambulances: response.data.ambulances || 0,
        oxygenCylinders: response.data.oxygenCylinders || 0,
        bloodUnits: response.data.bloodUnits || 0,
      });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to fetch resources");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetchResources();
  }, []);

  const handleChange = (e) => {
    setResources({
      ...resources,
      [e.target.name]: Number(e.target.value),
    });
  };

  const handleUpdateResources = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        "http://localhost:8081/api/hospital/resources",
        resources,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Hospital resources updated successfully");

      setResources({
        icuBeds: response.data.icuBeds || 0,
        generalBeds: response.data.generalBeds || 0,
        emergencyBeds: response.data.emergencyBeds || 0,
        ventilators: response.data.ventilators || 0,
        ambulances: response.data.ambulances || 0,
        oxygenCylinders: response.data.oxygenCylinders || 0,
        bloodUnits: response.data.bloodUnits || 0,
      });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update resources");
    }
  };

  return (
    <div className="resources-page">
      <aside className="resources-sidebar">
        <div className="resources-logo">🏥</div>

        <h2>MediLink AI</h2>
        <p>{hospitalName || "Hospital Admin"}</p>
        <span>{hospitalCode || "Hospital Code"}</span>

        <button onClick={() => navigate("/admin-dashboard")}>
          ← Back to Dashboard
        </button>
      </aside>

      <main className="resources-main">
        <header className="resources-header">
          <h1>Hospital Resources</h1>
          <p>
            Update hospital availability details for patients and emergency
            cases.
          </p>
        </header>

        <section className="resources-summary-grid">
          <div className="resource-summary-card">
            <div>🛏️</div>
            <h3>{resources.icuBeds}</h3>
            <p>ICU Beds</p>
          </div>

          <div className="resource-summary-card">
            <div>🚨</div>
            <h3>{resources.emergencyBeds}</h3>
            <p>Emergency Beds</p>
          </div>

          <div className="resource-summary-card">
            <div>🚑</div>
            <h3>{resources.ambulances}</h3>
            <p>Ambulances</p>
          </div>

          <div className="resource-summary-card">
            <div>💨</div>
            <h3>{resources.oxygenCylinders}</h3>
            <p>Oxygen Cylinders</p>
          </div>
        </section>

        <section className="resources-form-card">
          <h2>Update Resource Availability</h2>

          <form onSubmit={handleUpdateResources}>
            <div className="resources-form-grid">
              <div className="resource-form-group">
                <label>ICU Beds Available</label>
                <input
                  type="number"
                  name="icuBeds"
                  min="0"
                  value={resources.icuBeds}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>General Beds Available</label>
                <input
                  type="number"
                  name="generalBeds"
                  min="0"
                  value={resources.generalBeds}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>Emergency Beds Available</label>
                <input
                  type="number"
                  name="emergencyBeds"
                  min="0"
                  value={resources.emergencyBeds}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>Ventilators Available</label>
                <input
                  type="number"
                  name="ventilators"
                  min="0"
                  value={resources.ventilators}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>Ambulances Available</label>
                <input
                  type="number"
                  name="ambulances"
                  min="0"
                  value={resources.ambulances}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>Oxygen Cylinders Available</label>
                <input
                  type="number"
                  name="oxygenCylinders"
                  min="0"
                  value={resources.oxygenCylinders}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="resource-form-group">
                <label>Blood Units Available</label>
                <input
                  type="number"
                  name="bloodUnits"
                  min="0"
                  value={resources.bloodUnits}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="update-resources-btn">
              Update Resources
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default HospitalResources;