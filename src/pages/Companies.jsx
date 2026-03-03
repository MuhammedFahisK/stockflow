import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import { Building2, Plus } from 'lucide-react';

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 text-sm mt-1">Add and switch between companies</p>
        </div>
      </div>

      {canManage && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSaving(true);
              await createCompany(newCompanyName);
              setNewCompanyName('');
            } finally {
              setSaving(false);
            }
          }}
          className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Thara group"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-10 sm:mt-6 bg-blue-600 text-white px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {saving ? 'Adding…' : 'Add company'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Building2 className="mx-auto mb-3 text-gray-400" size={28} />
            No companies yet.
          </div>
        ) : (
          <div className="divide-y">
            {list.map((name) => (
              <button
                key={name}
                onClick={() => setActiveCompany(name)}
                className={`w-full text-left px-4 sm:px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between gap-3 ${
                  name === userCompany ? 'bg-blue-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-500">Click to activate</p>
                </div>
                {name === userCompany && (
                  <span className="shrink-0 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

