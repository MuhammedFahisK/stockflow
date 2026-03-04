import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import {
    User, Mail, Shield, Building2, Briefcase, Camera, ChevronRight, Edit3, Phone, Hash, CreditCard, X
} from 'lucide-react';

export default function Profile() {
    const { user, userName, userRole, userDept, userCompany, userData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordStatus, setPasswordStatus] = useState('');


    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, 'users', user.uid), editForm, { merge: true });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save details: ' + err.message);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordStatus('');
        const { newPassword, confirmPassword } = passwordForm;
        if (!newPassword || newPassword.length < 6) {
            setPasswordStatus('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus('Passwords do not match.');
            return;
        }
        try {
            await updatePassword(user, newPassword);
            setPasswordStatus('Password updated successfully.');
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            setPasswordStatus(err.message || 'Failed to update password.');
        }
    };

    const openEdit = () => {
        setEditForm({
            fullName: userData?.fullName || userName || '',
            department: userData?.department || userDept || '',
            phone: userData?.phone || '',
            gender: userData?.gender || '',
            dob: userData?.dob || '',
            identifyCode: userData?.identifyCode || '',
            hometown: userData?.hometown || '',
            nationality: userData?.nationality || '',
            religion: userData?.religion || '',
            language: userData?.language || '',
            maritalStatus: userData?.maritalStatus || '',
            permanentAddress: userData?.permanentAddress || '',
            currentAddress: userData?.currentAddress || '',
            bankAccount: userData?.bankAccount || '',
            bankName: userData?.bankName || '',
            bankAccountName: userData?.bankAccountName || '',
            taxCode: userData?.taxCode || '',
            insuranceCode: userData?.insuranceCode || '',
        });
        setIsEditing(true);
    };

    const handleEditChange = (e) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 text-white shadow-xl">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]" />
                <div className="relative p-10 flex flex-col lg:flex-row gap-10 lg:items-center">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em]">
                            <Shield size={14} /> Profile Overview
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-4xl font-black leading-tight drop-shadow-sm">{userName}</h1>
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 border border-white/20">
                                {userRole === 'SUPER_ADMIN' ? 'Super Admin' : (userRole || 'User')}
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-50 border border-emerald-200/40 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" /> Active
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-100/90">
                            <span className="inline-flex items-center gap-2"><Building2 size={16} /> {userCompany || 'Company not set'}</span>
                            <span className="inline-flex items-center gap-2"><Briefcase size={16} /> {userDept || 'Department not set'}</span>
                            <span className="inline-flex items-center gap-2"><Mail size={16} /> {user?.email}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 min-w-[240px]">
                        <StatPill label="Staff ID" value={user?.uid?.slice(0, 8) || '—'} icon={Hash} />
                        <StatPill label="Phone" value={userData?.phone || 'Not set'} icon={Phone} />
                        <StatPill label="Role" value={userRole || '—'} icon={Shield} />
                        <StatPill label="Company" value={userCompany || '—'} icon={Building2} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: personal + addresses */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Personal information" actionLabel="Edit" onAction={openEdit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoField label="Gender" value={userData?.gender || 'N/A'} />
                            <InfoField label="Date of birth" value={userData?.dob || 'N/A'} />
                            <InfoField label="Identify code" value={userData?.identifyCode || 'N/A'} />
                            <InfoField label="Hometown" value={userData?.hometown || 'N/A'} />
                            <InfoField label="Nationality" value={userData?.nationality || 'N/A'} />
                            <InfoField label="Religion" value={userData?.religion || 'N/A'} />
                            <InfoField label="Language" value={userData?.language || 'N/A'} />
                            <InfoField label="Marital status" value={userData?.maritalStatus || 'N/A'} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <InfoField label="Permanent address" value={userData?.permanentAddress || 'N/A'} />
                            <InfoField label="Current address" value={userData?.currentAddress || 'N/A'} />
                        </div>
                    </Card>

                    <Card title="Financial & account" actionLabel="Edit" onAction={openEdit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField label="Bank name" value={userData?.bankName || 'N/A'} />
                            <InfoField label="Bank account" value={userData?.bankAccount || 'N/A'} />
                            <InfoField label="Account holder" value={userData?.bankAccountName || 'N/A'} />
                            <InfoField label="Tax code" value={userData?.taxCode || 'N/A'} />
                            <InfoField label="Insurance code" value={userData?.insuranceCode || 'N/A'} />
                        </div>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Card title="Account information" actionLabel="Edit" onAction={openEdit}>
                        <div className="space-y-4">
                            <InfoField label="Email" value={user?.email || 'N/A'} />
                            <InfoField label="Phone" value={userData?.phone || 'Not set'} />
                            <InfoField label="Company" value={userCompany || 'Not set'} />
                            <InfoField label="Department" value={userDept || 'Not set'} />
                        </div>
                    </Card>

                    <Card title="Change password">
                        <form className="space-y-4" onSubmit={handlePasswordChange}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">New password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirm password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {passwordStatus && (
                                <div className={`text-sm font-semibold ${passwordStatus.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                                    {passwordStatus}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                            >
                                Update password
                            </button>
                        </form>
                    </Card>
                </div>
            </div>

            {/* Edit Modal */}
            {
                isEditing && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-gray-900">Update Profile Details</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto w-full custom-scrollbar">
                                <form id="editProfile" onSubmit={handleEditSave} className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Info</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputField label="Full Name" name="fullName" value={editForm.fullName} onChange={handleEditChange} />
                                            <InputField label="Department" name="department" value={editForm.department} onChange={handleEditChange} />
                                            <InputField label="Phone Number" name="phone" value={editForm.phone} onChange={handleEditChange} />
                                            <InputField label="Gender" name="gender" value={editForm.gender} onChange={handleEditChange} />
                                            <InputField label="Date of Birth" name="dob" value={editForm.dob} onChange={handleEditChange} type="date" />
                                            <InputField label="Identify Code / SSN" name="identifyCode" value={editForm.identifyCode} onChange={handleEditChange} />
                                            <InputField label="Hometown" name="hometown" value={editForm.hometown} onChange={handleEditChange} />
                                            <InputField label="Nationality" name="nationality" value={editForm.nationality} onChange={handleEditChange} />
                                            <InputField label="Religion" name="religion" value={editForm.religion} onChange={handleEditChange} />
                                            <InputField label="Marital Status" name="maritalStatus" value={editForm.maritalStatus} onChange={handleEditChange} />
                                            <InputField label="Language" name="language" value={editForm.language} onChange={handleEditChange} />
                                        </div>
                                        <div className="mt-4 space-y-4">
                                            <InputField label="Permanent Address" name="permanentAddress" value={editForm.permanentAddress} onChange={handleEditChange} />
                                            <InputField label="Current Address" name="currentAddress" value={editForm.currentAddress} onChange={handleEditChange} />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Financial & Account</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputField label="Bank Name" name="bankName" value={editForm.bankName} onChange={handleEditChange} />
                                            <InputField label="Bank Account No" name="bankAccount" value={editForm.bankAccount} onChange={handleEditChange} />
                                            <InputField label="Account Holder Name" name="bankAccountName" value={editForm.bankAccountName} onChange={handleEditChange} />
                                            <InputField label="Tax Code" name="taxCode" value={editForm.taxCode} onChange={handleEditChange} />
                                            <InputField label="Insurance Code" name="insuranceCode" value={editForm.insuranceCode} onChange={handleEditChange} />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" form="editProfile" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function InfoField({ label, value, size = "sm" }) {
    return (
        <div className="space-y-1.5 group">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight ${size === 'xs' ? 'text-xs' : 'text-sm'}`}>{value}</p>
        </div>
    );
}

function StatPill({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white/90 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/60 flex items-center gap-1">{label}</p>
            <div className="flex items-center gap-2 mt-1 font-bold text-sm">
                {Icon && <Icon size={16} className="text-white/70" />}
                <span>{value}</span>
            </div>
        </div>
    );
}

function Card({ title, actionLabel, onAction, children }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function InputField({ label, name, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all font-medium"
                placeholder={`Enter ${label.toLowerCase()}`}
            />
        </div>
    )
}
