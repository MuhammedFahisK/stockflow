import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Building2, User, ArrowRight, Briefcase } from 'lucide-react';
import LogoMark from '../components/LogoMark';
import { DEFAULT_DEPARTMENTS } from '../utils/permissions';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.password.trim()) {
      setError('Please enter your full name and password');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify user exists in the system
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('fullName', '==', formData.fullName)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('User not found. Please contact your Admin for access.');
        setLoading(false);
        return;
      }

      // Find the user whose password matches
      const userDoc = querySnapshot.docs.find(doc => doc.data().initialPassword === formData.password);

      if (!userDoc) {
        setError('Invalid password. Please use the password provided by your Admin.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // 3. Handle First-time Signup (Activation) vs Login
      if (userData.status === 'pending_signup') {
        // Create Firebase Auth account using the pre-stored email and admin password
        const { user } = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          formData.password
        );

        // Link the Firestore document to the Auth UID and mark as active
        await setDoc(doc(db, 'users', userDoc.id), {
          ...userData,
          uid: user.uid,
          status: 'active',
          lastLoginAt: new Date(),
        });
      } else {
        // Already active - standard login
        await signInWithEmailAndPassword(auth, userData.email, formData.password);

        // Update last login
        await setDoc(doc(db, 'users', userDoc.id), {
          ...userData,
          lastLoginAt: new Date(),
        }, { merge: true });
      }

      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md my-8">
        <div className="bg-white bg-opacity-95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <LogoMark className="h-16 w-16" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent mb-1">
              Sign Up
            </h1>
            <p className="text-gray-500 text-sm">Join using credentials provided by Admin</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-800"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transform transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (
                <>
                  <UserPlus size={18} />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                Sign In
              </Link>
            </p>
            <p className="text-gray-400 text-xs italic">
              Access restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
