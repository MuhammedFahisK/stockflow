import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import LogoMark from '../components/LogoMark';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <LogoMark className="h-14 w-14 rounded-2xl" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              StockFlow
            </h1>
            <p className="text-gray-600 text-sm">Inventory Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">
              Don't have an account?{' '}
              <a href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Sign up
                <ArrowRight size={14} />
              </a>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <p className="font-semibold text-gray-700 mb-2 text-sm">📝 Demo Account</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Email:</span> admin@stockflow.com</p>
              <p><span className="font-medium">Password:</span> Admin@123</p>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-white text-xs mt-6 opacity-75">
          Secure inventory management powered by Firebase
        </p>
      </div>
    </div>
  );
}
