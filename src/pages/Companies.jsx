import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import { Building2, Plus, CheckCircle, ChevronRight, Edit2, Trash2, X } from 'lucide-react';

export default function Companies() {
  const { userRole, companies, userCompany, setActiveCompany, createCompany, updateCompany, deleteCompany } = useAuth();
  const canManage = hasPermission(userRole, PERMISSIONS.COMPANIES_MANAGE);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState(null); // String name of company being edited
  const [renameValue, setRenameValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // String name of company being deleted

  const list = useMemo(() => {
    const arr = (companies || []).filter(Boolean);
    return Array.from(new Set(arr)).sort((a, b) => String(a).localeCompare(String(b)));
  }, [companies]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 text-sm mt-1">
            {canManage ? 'Add new companies and switch between them' : 'Select a company to work with'}
          </p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">
          {list.length} {list.length === 1 ? 'Company' : 'Companies'}
        </span>
      </div>

      {/* Add Company form — SUPER_ADMIN only */}
      {canManage && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newCompanyName.trim()) return;
            try {
              setSaving(true);
              await createCompany(newCompanyName.trim());
              setNewCompanyName('');
            } finally {
              setSaving(false);
            }
          }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              New Company Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Thara Pharma Ltd"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {saving ? 'Adding…' : 'Add Company'}
          </button>
        </form>
      )}

      {/* Company List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Building2 className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-semibold text-gray-700">No companies yet</p>
            {canManage && <p className="text-sm mt-1 text-gray-400">Add one using the form above.</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((name) => (
              <div
                key={name}
                className={`w-full px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 group ${name === userCompany ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
              >
                <button
                  onClick={() => setActiveCompany(name)}
                  className="flex-1 flex items-center gap-3 min-w-0 text-left"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${name === userCompany ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50 transition-colors'
                    }`}>
                    <Building2
                      size={18}
                      className={name === userCompany ? 'text-blue-600' : 'text-gray-400'}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold truncate ${name === userCompany ? 'text-blue-700' : 'text-gray-900'}`}>
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {name === userCompany ? 'Currently active' : 'Click to switch'}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {name === userCompany && (
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCompany(name);
                          setRenameValue(name);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Rename Company"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {name !== userCompany && !canManage && (
                    <ChevronRight size={18} className="text-gray-300 shrink-0 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Rename Company</h3>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!renameValue.trim() || renameValue.trim() === editingCompany) {
                  setEditingCompany(null);
                  return;
                }
                try {
                  setSaving(true);
                  await updateCompany(editingCompany, renameValue.trim());
                  setEditingCompany(null);
                } catch (error) {
                  alert('Error updating company name');
                } finally {
                  setSaving(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  placeholder="Enter new name"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  <span className="font-bold text-yellow-600">Note:</span> This will update the company name across all users and products. Existing transaction records may still show the old name.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {saving ? 'Renaming…' : 'Update Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Company?</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{showDeleteConfirm}"</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Keep It
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSaving(true);
                      await deleteCompany(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    } catch (error) {
                      alert('Error deleting company');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-50"
                >
                  {saving ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
