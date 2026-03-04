import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    Building2,
    Users as UsersIcon,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    X,
    Search,
    ArrowLeft
} from 'lucide-react';
import { PERMISSIONS, hasPermission, DEFAULT_DEPARTMENTS } from '../utils/permissions';

export default function Departments() {
    const { userCompany, userRole } = useAuth();
    const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
    const [employeesByDept, setEmployeesByDept] = useState({});
    const [selectedDept, setSelectedDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [newDeptName, setNewDeptName] = useState('');
    const [customDepts, setCustomDepts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const canManage = hasPermission(userRole, PERMISSIONS.DEPARTMENTS_MANAGE);

    useEffect(() => {
        if (userCompany) {
            fetchData();
        }
    }, [userCompany]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Custom Departments from Firestore
            const deptQ = query(collection(db, 'departments'), where('company', '==', userCompany));
            const deptSnap = await getDocs(deptQ);
            const customList = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCustomDepts(customList);

            // Combine defaults with custom
            const allDepts = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...customList.map(d => d.name)]));
            setDepartments(allDepts);

            // 2. Fetch Users to group by department
            const userQ = query(collection(db, 'users'), where('company', '==', userCompany));
            const userSnap = await getDocs(userQ);
            const employees = userSnap.docs.map(u => ({ id: u.id, ...u.data() }));

            const grouped = employees.reduce((acc, emp) => {
                const dept = emp.department || 'Unassigned';
                if (!acc[dept]) acc[dept] = [];
                acc[dept].push(emp);
                return acc;
            }, {});

            setEmployeesByDept(grouped);
        } catch (error) {
            console.error('Error fetching department data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDept = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        try {
            const nameTrimmed = newDeptName.trim();
            if (departments.some(d => d.toLowerCase() === nameTrimmed.toLowerCase() && d !== editingDept)) {
                alert('A department with this name already exists.');
                return;
            }

            setSaving(true);
            if (editingDept) {
                // Find existing custom dept if applicable
                const existing = customDepts.find(d => d.name === editingDept);
                if (existing) {
                    await updateDoc(doc(db, 'departments', existing.id), {
                        name: newDeptName.trim()
                    });
                }
            } else {
                await addDoc(collection(db, 'departments'), {
                    name: newDeptName.trim(),
                    company: userCompany,
                    createdAt: new Date()
                });
            }
            setNewDeptName('');
            setShowModal(false);
            setEditingDept(null);
            fetchData();
        } catch (error) {
            console.error('Error saving department:', error);
            alert('Error saving department');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDept = async (deptName) => {
        if (!window.confirm(`Are you sure you want to delete the "${deptName}" department?`)) return;

        try {
            const existing = customDepts.find(d => d.name === deptName);
            if (existing) {
                await deleteDoc(doc(db, 'departments', existing.id));
                fetchData();
            } else {
                alert('Default departments cannot be deleted.');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('Error deleting department');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {selectedDept && (
                        <button
                            onClick={() => setSelectedDept(null)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {selectedDept ? selectedDept : 'Departments'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {selectedDept
                                ? `Managing employees in ${selectedDept}`
                                : 'Overview of company organizational structure'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!selectedDept && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm"
                            />
                        </div>
                    )}

                    {!selectedDept && canManage && (
                        <button
                            onClick={() => {
                                setEditingDept(null);
                                setNewDeptName('');
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-semibold"
                        >
                            <Plus size={20} />
                            New Department
                        </button>
                    )}
                </div>
            </div>

            {!selectedDept ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments
                        .filter(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((dept) => {
                            const count = employeesByDept[dept]?.length || 0;
                            return (
                                <div
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors" />

                                    <div className="relative flex flex-col h-full">
                                        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Building2 size={24} />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{dept}</h3>
                                        <div className="mt-2 flex items-center gap-2 text-gray-500 font-medium">
                                            <UsersIcon size={16} />
                                            <span>{count} Employees</span>
                                        </div>

                                        <div className="mt-auto pt-6 flex justify-between items-center text-blue-600 font-bold text-sm">
                                            <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                                View Employees
                                            </span>
                                            <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                                        </div>

                                        {canManage && (
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingDept(dept);
                                                        setNewDeptName(dept);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Department"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {customDepts.some(d => d.name === dept) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDept(dept);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Department"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Employee List</h3>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {employeesByDept[selectedDept]?.length || 0} Total
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 text-gray-600 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Employee ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(employeesByDept[selectedDept] || []).map((emp) => (
                                    <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {emp.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{emp.fullName}</div>
                                                    <div className="text-xs text-gray-500">{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-blue-700">{emp.employeeId || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {emp.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {emp.role?.replace('_', ' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {(employeesByDept[selectedDept] || []).length === 0 && (
                            <div className="p-12 text-center text-gray-500 italic">
                                No employees currently assigned to this department.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Add/Edit Department */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingDept ? 'Edit' : 'Create'} Department
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDept} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department Name</label>
                                <input
                                    type="text"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                    placeholder="Enter name (e.g., Quality Control)"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : (editingDept ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
