import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import medicalImage from '../assets/medical_illustration.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pointing to local flask server for prototype
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      const { token, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // Redirect based on role
      navigate(`/${role.toLowerCase()}-dashboard`);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
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

      {/* Right side: Form matching reference layout with claymorphism */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden bg-white">
        
        {/* Geometric background accents mimicking the reference image */}
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
              {isForgotPassword ? 'Reset Password' : 'Login'}
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
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Password</label>
                <input 
                  type="password"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading}
                className="w-full py-4 px-4 bg-secondary text-white font-bold text-lg rounded-2xl hover:shadow-clay-hover transition-all active:scale-95 mt-4"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
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
