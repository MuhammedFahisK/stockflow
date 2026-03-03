import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, Building2, User, ArrowRight, ChevronDown } from 'lucide-react';
import LogoMark from '../components/LogoMark';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingCompanies, setExistingCompanies] = useState([]);
  const [showCompanyInput, setShowCompanyInput] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(collection(db, 'companies'));
      const list = snap.docs.map(d => d.id).sort();
      setExistingCompanies(list);
    };
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'companyName' && value === '__NEW__') {
      setShowCompanyInput(true);
      setFormData({ ...formData, companyName: '' });
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        role: 'SUPER_ADMIN',
        company: formData.companyName,
        createdAt: new Date(),
        status: 'active',
      });

      // Create company document
      await setDoc(doc(db, 'companies', formData.companyName), {
        name: formData.companyName,
        adminId: user.uid,
        createdAt: new Date(),
        status: 'active',
      });

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <LogoMark className="h-14 w-14 rounded-2xl" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-900 to-cyan-500 bg-clip-text text-transparent mb-2">
              Join StockFlow
            </h1>
            <p className="text-gray-600 text-sm">Create your account and get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            {/* Company Selection Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Company
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Building2 className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  {!showCompanyInput ? (
                    <select
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all"
                      required
                    >
                      <option value="">Choose a company...</option>
                      {existingCompanies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__NEW__">+ Add New Company</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="New Company Name"
                      required
                      autoFocus
                    />
                  )}
                  {!showCompanyInput && (
                    <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                  )}
                </div>

                {showCompanyInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompanyInput(false);
                      setFormData({ ...formData, companyName: '' });
                    }}
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    Back to selection
                  </button>
                ) : (
                  formData.companyName === '__NEW__' && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      {setShowCompanyInput(true)}
                      {setFormData({ ...formData, companyName: '' })}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-900 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-cyan-100 hover:text-white inline-flex items-center gap-1">
                Login
                <ArrowRight size={14} />
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-white text-xs mt-6 opacity-75">
          You'll be set as SUPER_ADMIN for your company
        </p>
      </div>
    </div>
  );
}
