import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import medicalImage from '../assets/medical_illustration.png';

export default function DoctorSignup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        password,
        phone_number: phoneNumber,
        email,
        role: 'Doctor'
      });

      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/doclogin');
      }, 2000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred during registration.');
      }
    } finally {
      setLoading(false);
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
              Doctor Sign Up
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

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Mobile Number</label>
              <input 
                type="tel"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Email Address</label>
              <input 
                type="email"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 tracking-wider">Confirm Password</label>
              <input 
                type="password"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 text-gray-800 border-none shadow-inner focus:ring-2 focus:ring-secondary outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 px-4 bg-secondary text-white font-bold text-lg rounded-2xl hover:shadow-clay-hover transition-all active:scale-95 mt-4"
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>

            <div className="text-center mt-6">
              <span className="text-sm text-gray-400 font-semibold">Already have an account? </span>
              <Link to="/doclogin" className="text-sm text-secondary font-bold hover:text-dark transition-colors">
                Login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
