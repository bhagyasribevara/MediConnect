import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PatientLogin from './pages/PatientLogin';
import PatientSignup from './pages/PatientSignup';
import DoctorLogin from './pages/DoctorLogin';
import DoctorSignup from './pages/DoctorSignup';
import AdminLogin from './pages/AdminLogin';
import OAuthCallback from './pages/OAuthCallback';
import { 
  PatientDashboard, 
  DoctorDashboard, 
  HospitalAdminDashboard, 
  DistrictAdminDashboard, 
  SuperAdminDashboard 
} from './pages/Dashboards';

// A protective route component with portal-specific redirects
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    if (allowedRole === 'Doctor') {
      return <Navigate to="/doclogin" replace />;
    } else if (allowedRole === 'Patient') {
      return <Navigate to="/login" replace />;
    } else {
      return <Navigate to="/adminlogin" replace />;
    }
  }

  // Role validation
  if (role !== allowedRole) {
    if (role === 'Doctor') {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (role === 'Patient') {
      return <Navigate to="/patient-dashboard" replace />;
    } else if (role === 'HospitalAdmin') {
      return <Navigate to="/hospitaladmin-dashboard" replace />;
    } else if (role === 'DistrictAdmin') {
      return <Navigate to="/districtadmin-dashboard" replace />;
    } else if (role === 'SuperAdmin') {
      return <Navigate to="/superadmin-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Isolated Path-based Login and Signup routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/signup" element={<PatientSignup />} />
        <Route path="/doclogin" element={<DoctorLogin />} />
        <Route path="/docsignup" element={<DoctorSignup />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        
        {/* Dashboards based on role */}
        <Route 
          path="/patient-dashboard" 
          element={
            <ProtectedRoute allowedRole="Patient">
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor-dashboard" 
          element={
            <ProtectedRoute allowedRole="Doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hospitaladmin-dashboard" 
          element={
            <ProtectedRoute allowedRole="HospitalAdmin">
              <HospitalAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/districtadmin-dashboard" 
          element={
            <ProtectedRoute allowedRole="DistrictAdmin">
              <DistrictAdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/superadmin-dashboard" 
          element={
            <ProtectedRoute allowedRole="SuperAdmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
