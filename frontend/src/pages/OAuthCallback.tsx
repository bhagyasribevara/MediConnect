import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const error = params.get('error');

    if (error) {
      console.error('OAuth Callback Error:', error);
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (token && role) {
      // Save credentials matching existing auth architecture
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // Redirect user to the corresponding dashboard based on their role
      if (role === 'Patient') {
        navigate('/patient-dashboard', { replace: true });
      } else if (role === 'Doctor') {
        navigate('/doctor-dashboard', { replace: true });
      } else if (role === 'HospitalAdmin') {
        navigate('/hospitaladmin-dashboard', { replace: true });
      } else if (role === 'DistrictAdmin') {
        navigate('/districtadmin-dashboard', { replace: true });
      } else if (role === 'SuperAdmin') {
        navigate('/superadmin-dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } else {
      console.error('OAuth Callback Error: Token or role missing.');
      navigate('/login?error=authentication_failed', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 rounded-3xl bg-white shadow-clay max-w-sm w-full mx-4 border border-gray-100">
        {/* Animated Loading Ring */}
        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Session</h2>
        <p className="text-gray-500 text-sm">Please wait while we log you into MediConnect...</p>
      </div>
    </div>
  );
}
