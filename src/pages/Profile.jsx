import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc, setDoc } from 'firebase/firestore';
import {
    User, Mail, Shield, Building2, Briefcase, Camera, ChevronRight, Edit3, Phone, Hash, CreditCard, X
} from 'lucide-react';

export default function Profile() {
    const { user, userName, userRole, userDept, userCompany, userData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});


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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
            {/* Profile Header */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 flex flex-col lg:flex-row gap-12 items-center lg:items-start relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-1000 group-hover:bg-blue-100/30"></div>

                <div className="flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left z-10 w-full lg:w-auto">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">{userName}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                {userRole === 'SUPER_ADMIN' ? 'Owner | Super Admin' : userRole?.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 font-medium text-sm">| {userDept || 'General Department'}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-lg text-xs font-bold">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                            </div>
                            <p className="text-xs text-gray-400 font-medium tracking-tight">Status: Active Employee</p>
                        </div>
                    </div>
                </div>

                {/* Right Side Key Stats */}
                <div className="lg:ml-auto grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10 z-10 w-full lg:w-auto mt-10 lg:mt-0 pt-10 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-16">
                    <div className="space-y-1 group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={12} className="text-gray-300" /> Staff ID</p>
                        <p className="text-sm font-black text-gray-700 uppercase tracking-tight">{user?.uid?.slice(0, 8)}</p>
                    </div>
                    <div className="space-y-1 group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} className="text-gray-300" /> Phone number</p>
                        <p className="text-sm font-black text-gray-700">{userData?.phone || 'Not updated'}</p>
                    </div>
                    <div className="space-y-1 group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12} className="text-gray-300" /> Company</p>
                        <p className="text-sm font-black text-gray-700 tracking-tight">{userCompany}</p>
                    </div>
                    <div className="space-y-1 group">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> Email</p>
                        <p className="text-sm font-black text-gray-700 tracking-tight break-all">{user?.email}</p>
                    </div>
                </div>
            </div >

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-8 bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-600 rounded-full"></div> Personal information
                        </h3>
                        <button onClick={openEdit} className="p-2.5 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                        <InfoField label="Gender" value={userData?.gender || 'N/A'} />
                        <InfoField label="Date of birth" value={userData?.dob || 'N/A'} />
                        <InfoField label="Identify code" value={userData?.identifyCode || 'N/A'} />
                        <InfoField label="Hometown" value={userData?.hometown || 'N/A'} />
                        <InfoField label="Nationality" value={userData?.nationality || 'N/A'} />
                        <InfoField label="Religion" value={userData?.religion || 'N/A'} />
                        <InfoField label="Language" value={userData?.language || 'N/A'} />
                        <InfoField label="Marital status" value={userData?.maritalStatus || 'N/A'} />
                        <div className="md:col-span-2"><InfoField label="Permanent address" value={userData?.permanentAddress || 'N/A'} /></div>
                        <div className="md:col-span-2"><InfoField label="Current address" value={userData?.currentAddress || 'N/A'} /></div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Account Information */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Account information</h3>
                            <button onClick={openEdit} className="text-gray-300 hover:text-blue-600 transition-colors"><Edit3 size={18} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <InfoField label="Bank account" value={userData?.bankAccount || 'N/A'} size="xs" />
                                <InfoField label="Bank" value={userData?.bankName || 'N/A'} size="xs" />
                            </div>
                            <InfoField label="Account name" value={userData?.bankAccountName || 'N/A'} size="xs" />
                            <div className="grid grid-cols-2 gap-6">
                                <InfoField label="Tax code" value={userData?.taxCode || 'N/A'} size="xs" />
                                <InfoField label="Insurance code" value={userData?.insuranceCode || 'N/A'} size="xs" />
                            </div>
                        </div>
                    </div>

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
