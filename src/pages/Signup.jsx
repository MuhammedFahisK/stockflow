import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import tghLogo from '../assets/tgh.jpg.jpeg';

const COMPANY_NAME = 'Thara Global Holdings';
const COMPANY_TAGLINE = 'THARA GLOBAL HOLDINGS';
const COMPANY_VISION = 'Corporate Vision & Strategy';
const COMPANY_QUOTE = 'Thara Global Holdings: Empowering Commerce, Enriching Lives.';

export default function Signup() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      try {
        await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const activeUser = auth.currentUser;
        if (activeUser) {
          await setDoc(doc(db, 'users', activeUser.uid), { lastLoginAt: new Date() }, { merge: true });
        }
        navigate('/');
        return;
      } catch (signInErr) {
        const notFound = [
          'auth/user-not-found',
          'auth/wrong-password',
          'auth/invalid-credential',
          'auth/invalid-login-credentials',
        ];
        if (!notFound.includes(signInErr.code)) throw signInErr;
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
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

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.email.trim()), where('status', '==', 'pending_signup'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await newAuthUser.delete();
        await signOut(auth);
        newAuthUser = null;
        setError('No pending account found for this email. Please contact your Admin.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.initialPassword !== formData.password) {
        await newAuthUser.delete();
        await signOut(auth);
        newAuthUser = null;
        setError('Incorrect initial password. Please use the one provided by your Admin.');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, 'users', newAuthUser.uid), {
        ...userData,
        uid: newAuthUser.uid,
        status: 'active',
        lastLoginAt: new Date(),
      }, { merge: true });
      await deleteDoc(doc(db, 'users', userDoc.id));
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
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
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f2744 0%, #1a3a6b 40%, #1e4080 70%, #162d55 100%)',
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glass curtain effect */}
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${i * 13}%`,
                top: 0,
                bottom: 0,
                width: '10%',
                background: i % 2 === 0
                  ? 'linear-gradient(180deg, rgba(100,160,255,0.08) 0%, rgba(50,100,200,0.05) 50%, rgba(100,160,255,0.08) 100%)'
                  : 'linear-gradient(180deg, rgba(30,80,160,0.12) 0%, rgba(80,130,220,0.07) 50%, rgba(30,80,160,0.12) 100%)',
              }}
            />
          ))}
        </div>
        <div className="absolute top-0 left-0 right-0 h-2/5 opacity-30"
          style={{
            background: 'linear-gradient(180deg, rgba(150,200,255,0.3) 0%, rgba(80,140,220,0.15) 60%, transparent 100%)',
          }}
        />

        {/* Logo watermark */}
        <div className="relative z-10">
          <img src={tghLogo} alt={COMPANY_NAME} className="h-20 w-auto object-contain opacity-80" />
        </div>

        {/* Quote + Company info */}
        <div className="relative z-10">
          <blockquote className="text-white text-2xl font-semibold leading-relaxed mb-8 max-w-md">
            "{COMPANY_QUOTE}"
          </blockquote>
          <div>
            <p className="text-white font-bold text-base">{COMPANY_NAME}</p>
            <p className="text-blue-300 text-sm mt-0.5">{COMPANY_VISION}</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <img
              src={tghLogo}
              alt={COMPANY_NAME}
              className="h-32 w-auto object-contain mb-3"
            />
            <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">{COMPANY_TAGLINE}</p>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Activate Account</h1>
            <p className="text-slate-400 text-sm">Use the credentials provided by your administrator.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="name@tharaglobal.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg pl-10 pr-11 py-2.5 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Activate Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                Sign In
              </Link>
            </p>
            <p className="text-xs text-slate-300 italic">Access restricted to authorized personnel only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}