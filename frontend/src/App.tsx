import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { 
  PatientDashboard, 
  DoctorDashboard, 
  HospitalAdminDashboard, 
  DistrictAdminDashboard, 
  SuperAdminDashboard 
} from './pages/Dashboards';

// A simple protective route component
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Very basic role check for prototype
  if (role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
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
