
import { User, Stethoscope, Building2, ArrowRight, Star, Users, Hospital, Activity, CheckCircle, Clock, Heart, Zap } from 'lucide-react';
import { FaUserFriends, FaUserMd, FaHospital, FaClock } from 'react-icons/fa';

import { Link } from "react-router-dom";
import "../assets/styles/styles.css";

export default function Home() {
  return (
    <div className="home-container">
      {/* ===== NAVBAR ===== */}
      <header className="navbar">
        <div className="logo">❤️ <span>MEDICARE</span></div>
        <div className="profile">👤</div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="title">
          The Future of <br />
          <span>Smart Healthcare</span>
        </h1>

        <p className="subtitle">
          A secure and intelligent platform connecting patients, doctors,
          and hospitals in one seamless ecosystem.
        </p>

      <div className="hero-btn">
  <a href="#modules" className="primary-btn">
    Explore Modules <span className="arrow">➜</span>
  </a>
</div>
      </section>

      {/* ===== MODULES ===== */}
<section id="modules" className="modules">

  <div className="modules-header">
    <h2 className="modules-title">Choose Your Portal</h2>
    <p className="modules-subtitle">
      Select the module that best fits your role
    </p>
  </div>

  <div className="modules-row">
    <div className="card">
      <div className="icon">👤</div>
      <h3>Patient Portal</h3>
      <p>Access records, book appointments and consult doctors.</p>
      <Link to="/patient-login" className="btn">
  Get Started <span className="arrow">➜</span>
</Link>
    </div>

    <div className="card">
      <div className="icon">🩺</div>
      <h3>Doctor Portal</h3>
      <p>Manage patients, consultations and prescriptions.</p>
      <Link to="/doctor-login" className="btn">Get Started<span className="arrow">➜</span></Link>
    </div>

    <div className="card">
      <div className="icon">🏥</div>
      <h3>Hospital Admin</h3>
      <p>Control staff, operations and analytics efficiently.</p>
      <Link to="/admin-login" className="btn">Get Started <span className="arrow">➜</span></Link>
    </div>
  </div>
{/* ===== HOW IT WORKS ===== */}
<section className="how">

  <div className="how-header">
    <h2 className="how-title">How It Works</h2>
    <p className="how-subtitle">Get started in four simple steps</p>
  </div>

  <div className="how-row">

    <div className="how-card">
      <div className="how-icon gradient1">👤</div>
      <span className="step-number">01</span>
      <h3>Choose Your Role</h3>
      <p>
        Select whether you are a Patient, Doctor, or Hospital Administrator
        to access the right portal for you.
      </p>
    </div>

    <div className="how-card">
      <div className="how-icon gradient2">✔</div>
      <span className="step-number">02</span>
      <h3>Create Account</h3>
      <p>
        Sign up with your details and verify your identity through our secure
        OTP verification system.
      </p>
    </div>

    <div className="how-card">
      <div className="how-icon gradient3">⚡</div>
      <span className="step-number">03</span>
      <h3>Access Dashboard</h3>
      <p>
        Login to your personalized dashboard with role-specific features
        and real-time data insights.
      </p>
    </div>

    <div className="how-card">
      <div className="how-icon gradient4">❤</div>
      <span className="step-number">04</span>
      <h3>Manage Healthcare</h3>
      <p>
        Book appointments, manage records, issue prescriptions, or oversee
        hospital operations seamlessly.
      </p>
    </div>

  </div>
</section>

<section className="features">
  <h2 className="section-title">Why Choose Medicare</h2>
  <p className="section-subtitle">Built for the modern healthcare ecosystem</p>

  <div className="feature-grid">

    <div className="feature-card">
      <div className="feature-icon">⏰</div>
      <h3>24/7 Accessibility</h3>
      <p>Access your healthcare information anytime, anywhere from any device.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">✔</div>
      <h3>Verified Healthcare</h3>
      <p>All doctors and hospitals are verified to ensure quality and trust.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">⚡</div>
      <h3>Lightning Fast</h3>
      <p>Optimized performance for quick access to critical health information.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">❤</div>
      <h3>Patient-Centered</h3>
      <p>Designed with patient care and experience as the top priority.</p>
    </div>

  </div>
</section>
</section>
<section className="stats">
  <div className="stats-wrapper">
    
    <div className="stat-card">
      <FaUserFriends size={40} className="stat-icon" />
      <h2>10K+</h2>
      <p>Patients Served</p>
    </div>

    <div className="stat-card">
      <FaUserMd size={40} className="stat-icon" />
      <h2>500+</h2>
      <p>Doctors</p>
    </div>

    <div className="stat-card">
      <FaHospital size={40} className="stat-icon" />
      <h2>50+</h2>
      <p>Hospitals</p>
    </div>

    <div className="stat-card">
      <FaClock size={40} className="stat-icon" />
      <h2>99.9%</h2>
      <p>Uptime</p>
    </div>

  </div>
</section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© 2026 Medicare Healthcare System</p>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}