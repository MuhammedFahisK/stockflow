import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Edit2, Trash2, Mail, User, Search, Filter } from 'lucide-react';
import {
  PERMISSIONS,
  hasPermission,
  ROLE_LABELS,
  DEFAULT_DEPARTMENTS,
} from '../utils/permissions';
import { logActivity } from '../utils/activityLogger';

export default function Users() {
  const { userCompany, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');


  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'DEPARTMENT_USER',
    department: DEFAULT_DEPARTMENTS[0],
    employeeId: '',
    password: '',
  });

  const canManage = hasPermission(userRole, PERMISSIONS.USERS_CREATE);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'departments'));
      const customList = snapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setDepartments(Array.from(new Set([...DEFAULT_DEPARTMENTS, ...customList])));
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Show both active and pending_signup users (exclude system-bootstrap docs without a name)
      setUsers(data.filter(u => u.fullName && (u.status === 'active' || u.status === 'pending_signup')));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const fullName = formData.fullName.trim();

    if (!editingUser && formData.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      const isSuperAdminRole = formData.role === 'SUPER_ADMIN';
      const departmentToSave = isSuperAdminRole ? 'SUPER_ADMIN' : formData.department || null;

      if (editingUser) {
        // Update user
        await updateDoc(doc(db, 'users', editingUser.id), {
          fullName,
          // keep existing role so SUPER_ADMIN flag cannot be changed here
          role: editingUser.role || 'DEPARTMENT_USER',
          department: departmentToSave,
        });
        logActivity({
          userId: auth?.currentUser?.uid || null,
          company: userCompany,
          action: 'user:update',
          details: `id=${editingUser.id} name=${fullName}`,
        });
      } else {
        // Create new user (pending signup sequence — no company assigned at creation)
        const ref = await addDoc(collection(db, 'users'), {
          email,
          fullName,
          role: 'DEPARTMENT_USER',
          department: departmentToSave,
          employeeId: formData.employeeId,
          initialPassword: formData.password,
          status: 'pending_signup',
          createdAt: serverTimestamp(),
        });
        logActivity({
          userId: auth?.currentUser?.uid || null,
          company: userCompany || null,
          action: 'user:create',
          details: `id=${ref.id} name=${fullName}`,
        });
      }

      fetchUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        role: 'DEPARTMENT_USER',
        department: DEFAULT_DEPARTMENTS[0],
        employeeId: '',
        password: '',
      });
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error?.code === 'permission-denied'
        ? 'Permission denied while saving user. Please ensure your Firestore rules and company selection are correct.'
        : error?.message || 'Error saving user.';
      alert(message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'DEPARTMENT_USER',
      department: user.department || DEFAULT_DEPARTMENTS[0],
      employeeId: user.employeeId || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    const newId = 'EMP' + Math.floor(1000 + Math.random() * 9000);
    setFormData({
      fullName: '',
      email: '',
      role: 'DEPARTMENT_USER',
      department: DEFAULT_DEPARTMENTS[0],
      employeeId: newId,
      password: '',
    });
    setEditingUser(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        logActivity({
          userId: auth?.currentUser?.uid || null,
          company: userCompany,
          action: 'user:delete',
          details: `id=${id}`,
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage team members and their access levels</p>
        </div>
        {canManage && (
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md font-medium"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users yet</div>
        ) : (
          <div className="overflow-x-auto">
            {Object.entries(
              users
                .filter(u => {
                  const matchesSearch =
                    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

                  const dept = u.department || 'Unassigned';
                  const matchesDept = filterDept === 'All' || dept === filterDept;

                  return matchesSearch && matchesDept;
                })
                .reduce((acc, user) => {
                  const dept = user.department || 'Unassigned';
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(user);
                  return acc;
                }, {})
            )
              .sort((a, b) => a[0].localeCompare(b[0])) // Sort departments alphabetically
              .map(([department, deptUsers]) => (
                <div key={department} className="mb-0 border-b border-gray-100 last:border-0">
                  <div className="bg-gray-50/50 px-6 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{department}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                      {deptUsers.length}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Email</th>
                        <th className="px-4 py-3 text-left font-semibold">Company</th>
                        <th className="px-4 py-3 text-left font-semibold">Role</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                <User size={16} />
                              </div>
                              <span className="font-medium">{user.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail size={14} />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                              {user.company || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                              {user.role === 'SUPER_ADMIN'
                                ? ROLE_LABELS.SUPER_ADMIN
                                : ROLE_LABELS.DEPARTMENT_USER}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : user.status === 'pending_signup'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {user.status === 'pending_signup' ? 'Pending' : (user.status || 'active')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="text-blue-600 hover:text-blue-800 inline-block"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="text-red-600 hover:text-red-800 inline-block"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {
        showModal && canManage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email {editingUser ? '(Cannot change)' : '*'}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={!!editingUser}
                      required={!editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Password *
                      </label>
                      <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Assign a temporary password"
                        required={!editingUser}
                        minLength={6}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Must be at least 6 characters. Employee will use this to sign up</p>
                    </div>
                  )}



                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department {formData.role === 'SUPER_ADMIN' ? '(auto-set for super admin)' : '*'}
                    </label>
                    {formData.role === 'SUPER_ADMIN' ? (
                      <input
                        type="text"
                        value="SUPER_ADMIN"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingUser(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      {editingUser ? 'Update' : 'Add'} User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
