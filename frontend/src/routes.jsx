import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import DoctorLogin from "./pages/DoctorLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import AddDoctor from "./pages/AddDoctor";
import DoctorDashboard from "./pages/DoctorDashboard";
import HospitalResources from "./pages/HospitalResources";
import QueueManagement from "./pages/QueueManagement";
import PatientDoctorSearch from "./pages/PatientDoctorSearch";
import PatientUploadReport from "./pages/PatientUploadReport";
import PatientRecords from "./pages/PatientRecords";
import PatientQRSharing from "./pages/PatientQRSharing";
import SharedRecordsView from "./pages/SharedRecordsView";
import PatientAccessRequests from "./pages/PatientAccessRequests";
import DoctorQRAccess from "./pages/DoctorQRAccess";
import PatientSharedHistory from "./pages/PatientSharedHistory";
import HospitalAppointments from "./pages/HospitalAppointments";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Login Routes */}
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Dashboard Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/admin/add-doctor" element={<AddDoctor />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/admin/resources" element={<HospitalResources />} />
        <Route path="/admin/queue" element={<QueueManagement />} />
        <Route path="/patient/doctors" element={<PatientDoctorSearch />} />
        <Route path="/patient/upload-report" element={<PatientUploadReport />} />
        <Route path="/patient/records" element={<PatientRecords />} />
        <Route path="/patient/qr-sharing" element={<PatientQRSharing />} />
        <Route path="/shared-records/:accessToken" element={<SharedRecordsView />} />
        <Route path="/patient/access-requests" element={<PatientAccessRequests />} />
       
        <Route path="/doctor/qr-access" element={<DoctorQRAccess />} />
<Route path="/qr-access/:accessToken" element={<DoctorQRAccess />} />
<Route path="/patient/shared-history" element={<PatientSharedHistory />} />
<Route path="/admin/appointments" element={<HospitalAppointments />} />
<Route path="/patient/appointments" element={<PatientAppointments />} />
<Route path="/doctor/appointments" element={<DoctorAppointments />} />
      </Routes>
    </BrowserRouter>
  );
}