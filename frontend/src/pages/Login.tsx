import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex items-center justify-center bg-clay p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-primary shadow-clay"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">MediConnect</h1>
          <p className="text-gray-500">
            {isForgotPassword ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm">
            {message}
          </div>
        )}

        {!isForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-secondary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-secondary text-white font-semibold rounded-xl shadow-clay hover:shadow-clay-hover transition-all active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={otpSent}
                required
              />
            </div>

            {!otpSent ? (
              <button 
                onClick={handleSendOtp}
                className="w-full py-3 px-4 bg-secondary text-white font-semibold rounded-xl shadow-clay hover:shadow-clay-hover transition-all active:scale-95"
              >
                Send OTP
              </button>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                  <input 
                    type="text"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 px-4 bg-secondary text-white font-semibold rounded-xl shadow-clay hover:shadow-clay-hover transition-all active:scale-95"
                >
                  Reset Password
                </button>
              </form>
            )}
            
            <div className="text-center mt-4">
              <button 
                onClick={() => { setIsForgotPassword(false); setOtpSent(false); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
