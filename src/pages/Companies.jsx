import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import { Building2, Plus, CheckCircle, ChevronRight } from 'lucide-react';

export default function Companies() {
  const { userRole, companies, userCompany, setActiveCompany, createCompany } = useAuth();
  const canManage = hasPermission(userRole, PERMISSIONS.COMPANIES_MANAGE);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [saving, setSaving] = useState(false);

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
              <button
                key={name}
                onClick={() => setActiveCompany(name)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 group ${name === userCompany ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
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
                </div>

                {name === userCompany ? (
                  <CheckCircle size={20} className="text-blue-500 shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-gray-300 shrink-0 group-hover:text-blue-400 transition-colors" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
