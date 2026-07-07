import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import medicalImage from '../assets/medical_illustration.png';

export default function DoctorLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (lockoutSeconds === null) return;
    if (lockoutSeconds <= 0) {
      setLockoutSeconds(null);
      setError('');
      return;
    }

    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setError('');
          return null;
        }
        const nextSecs = prev - 1;
        const mins = Math.floor(nextSecs / 60);
        const secs = nextSecs % 60;
        const timeStr = mins > 0 
          ? `${mins} minutes and {secs} seconds` 
          : `${secs} seconds`;
        setError(`Too many failed attempts. Please try again after ${timeStr}.`);
        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      if (err === 'oauth_authentication_failed') {
        setError('Google OAuth authentication failed. Please try again.');
      } else if (err === 'email_not_verified') {
        setError('Your Google email is not verified.');
      } else if (err === 'no_code_from_google') {
        setError('Did not receive an authorization code from Google.');
      } else {
        setError(err.replace(/_/g, ' '));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
        role: 'Doctor'
      });

      const { token, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // Redirect to doctor dashboard
      navigate('/doctor-dashboard');
    } catch (err: any) {
      if (err.response && err.response.data) {
        const { message, remaining_seconds } = err.response.data;
        if (remaining_seconds) {
          setLockoutSeconds(remaining_seconds);
        }
        setError(message);
      } else {
        setError('An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        username
      });
      setMessage(response.data.message);
      setOtpSent(true);
    } catch (err: any) {
      setError('Failed to send OTP.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        username,
        otp,
        new_password: newPassword
      });
      setMessage(response.data.message);
      setTimeout(() => {
        setIsForgotPassword(false);
        setOtpSent(false);
        setMessage('');
        setPassword('');
      }, 2000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to reset password.');
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google/login?role=Doctor';
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-clay">
      {/* Left side: Image matching reference */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-accent overflow-hidden flex-col items-center justify-center p-12">
        <img 
          src={medicalImage} 
          alt="MediConnect App Illustration" 
          className="w-full max-w-2xl object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Right side: Form with claymorphism */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden bg-white">
        
        {/* Geometric background accents */}
        <div className="absolute top-0 right-0 w-[150%] h-[40%] bg-accent -z-10 origin-top-right transform -skew-y-[15deg]"></div>
        <div className="absolute bottom-0 left-0 w-[150%] h-[40%] bg-accent -z-10 origin-bottom-left transform -skew-y-[15deg]"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-10 rounded-3xl bg-primary shadow-clay z-10"
        >
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white shadow-clay">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <span className="text-3xl font-bold text-secondary">MediConnect</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-dark mb-2">
              {isForgotPassword ? 'Reset Password' : 'Doctor Login'}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 shadow-inner">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl text-sm border border-green-100 shadow-inner">
              {message}
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Username</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all disabled:opacity-50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || lockoutSeconds !== null}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Password</label>
                <input 
                  type="password"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || lockoutSeconds !== null}
                  required
                />
              </div>
              
              <div className="flex justify-end mt-2 mb-2">
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-secondary font-semibold hover:text-dark transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading || lockoutSeconds !== null}
                className="w-full py-4 px-4 bg-secondary text-white font-bold text-lg rounded-2xl hover:shadow-clay-hover transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>

              {/* Prominent Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || lockoutSeconds !== null}
                className="w-full py-4 px-4 bg-white text-dark font-bold text-lg rounded-2xl shadow-clay hover:shadow-clay-hover border border-gray-100 flex items-center justify-center space-x-3 transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center mt-6">
                <span className="text-sm text-gray-400 font-semibold">New to MediConnect? </span>
                <Link to="/docsignup" className="text-sm text-secondary font-bold hover:text-dark transition-colors">
                  Sign Up
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
               <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Username</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={otpSent}
                  required
                />
              </div>

              {!otpSent ? (
                <button 
                  onClick={handleSendOtp}
                  className="w-full py-4 px-4 bg-secondary text-white font-bold text-lg rounded-2xl shadow-clay hover:shadow-clay-hover transition-all active:scale-95 mt-4"
                >
                  Send OTP
                </button>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Enter 6-digit OTP</label>
                    <input 
                      type="text"
                      maxLength={6}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">New Password</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-4 px-4 bg-secondary text-white font-bold text-lg rounded-2xl shadow-clay hover:shadow-clay-hover transition-all active:scale-95 mt-4"
                  >
                    Reset Password
                  </button>
                </form>
              )}
              
              <div className="text-center mt-8">
                <button 
                  onClick={() => { setIsForgotPassword(false); setOtpSent(false); }}
                  className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
