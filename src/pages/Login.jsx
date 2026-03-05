import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import tghLogo from '../assets/tgh.jpg.jpeg';

const COMPANY_NAME = 'Thara Global Holdings';
const COMPANY_TAGLINE = 'THARA GLOBAL HOLDINGS';
const COMPANY_VISION = 'Corporate Vision & Strategy';
const COMPANY_QUOTE = 'Thara Global Holdings: Empowering Commerce, Enriching Lives.';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                navigate('/');
            } else {
                setError('User record not found in system.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid email or password. Please try again.');
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
                {/* Architectural grid lines overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />
                {/* Glass reflection effect */}
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
                {/* Sky reflection at top */}
                <div className="absolute top-0 left-0 right-0 h-2/5 opacity-30"
                    style={{
                        background: 'linear-gradient(180deg, rgba(150,200,255,0.3) 0%, rgba(80,140,220,0.15) 60%, transparent 100%)',
                    }}
                />

                {/* Logo watermark top-left */}
                <div className="relative z-10">
                    <img src={tghLogo} alt={COMPANY_NAME} className="h-12 w-auto object-contain opacity-80" />
                </div>

                {/* Quote + Company info — bottom */}
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
                            className="h-20 w-auto object-contain mb-3"
                        />
                        <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">{COMPANY_TAGLINE}</p>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-1">Welcome back</h1>
                        <p className="text-slate-400 text-sm">Please enter your details to sign in.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                    placeholder="admin@tharaglobal.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        {/* Remember me + Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                Forgot password?
                            </a>
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
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer link */}
                    <p className="text-center text-sm text-slate-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                            Contact Administrator
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
