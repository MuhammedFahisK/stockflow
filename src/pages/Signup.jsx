import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Building2, User, ArrowRight, Briefcase, AtSign } from 'lucide-react';
import LogoMark from '../components/LogoMark';
import { DEFAULT_DEPARTMENTS } from '../utils/permissions';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
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

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    let newAuthUser = null;

    try {
      // Step 1: Try signing in first (already-active accounts).
      // Firestore queries must run AFTER authentication, so we authenticate first.
      try {
        await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const activeUser = auth.currentUser;
        if (activeUser) {
          await setDoc(doc(db, 'users', activeUser.uid), {
            lastLoginAt: new Date(),
          }, { merge: true });
        }
        navigate('/');
        return;
      } catch (signInErr) {
        // These codes mean no existing account — fall through to activation flow.
        const notFound = [
          'auth/user-not-found',
          'auth/wrong-password',
          'auth/invalid-credential',
          'auth/invalid-login-credentials',
        ];
        if (!notFound.includes(signInErr.code)) throw signInErr;
      }

      // Step 2: No existing Auth account — create one first so we are authenticated
      // before touching Firestore (avoids permission-denied on unauthenticated reads).
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );
        newAuthUser = credential.user;
      } catch (createErr) {
        if (createErr.code === 'auth/email-already-in-use') {
          setError('This email is already registered. Please use the Sign In page.');
        } else {
          setError(createErr.message);
        }
        setLoading(false);
        return;
      }

      // Step 3: Now authenticated — query Firestore for the pending_signup record.
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', formData.email.trim()),
        where('status', '==', 'pending_signup')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No pending record — undo the Auth account we just created.
        await newAuthUser.delete();
        await signOut(auth);
        newAuthUser = null;
        setError('No pending account found for this email. Please contact your Admin.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Step 4: Verify the initial password set by the Admin.
      if (userData.initialPassword !== formData.password) {
        await newAuthUser.delete();
        await signOut(auth);
        newAuthUser = null;
        setError('Incorrect initial password. Please use the one provided by your Admin.');
        setLoading(false);
        return;
      }

      // Step 5: Activate — write permanent UID-keyed doc, remove temp Admin doc.
      await setDoc(doc(db, 'users', newAuthUser.uid), {
        ...userData,
        status: 'active',
        lastLoginAt: new Date(),
      });
      await deleteDoc(doc(db, 'users', userDoc.id));

      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      // Roll back the created Auth user on unexpected failure.
      if (newAuthUser) {
        try { await newAuthUser.delete(); await signOut(auth); } catch (_) { }
      }
      if (err.code === 'permission-denied') {
        setError('Firestore permissions not configured. Please ask your Admin to update the Firebase security rules.');
      } else {
        setError(err.message);
      }
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
              Join StockFlow
            </h1>
            <p className="text-gray-500 text-sm">Activate your account with Admin credentials</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Work Email</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-800"
                  placeholder="name@company.com"
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
