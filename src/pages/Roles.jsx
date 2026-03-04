import React, { useState } from 'react';
import { ROLE_PERMISSIONS, PERMISSIONS, ROLE_LABELS } from '../utils/permissions';
import { Shield, Check, X } from 'lucide-react';

export default function Roles() {
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');

  const roles = Object.keys(ROLE_PERMISSIONS);
  const roleColors = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    DEPARTMENT_USER: 'bg-blue-100 text-blue-700',
  };

  const permissionCategories = {
    'Products': [PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_DELETE],
    'Incoming Stock': [PERMISSIONS.INCOMING_READ, PERMISSIONS.INCOMING_CREATE, PERMISSIONS.INCOMING_UPDATE, PERMISSIONS.INCOMING_DELETE],
    'Outgoing Stock': [PERMISSIONS.OUTGOING_READ, PERMISSIONS.OUTGOING_CREATE, PERMISSIONS.OUTGOING_UPDATE, PERMISSIONS.OUTGOING_DELETE],
    'Returns': [PERMISSIONS.RETURNS_READ, PERMISSIONS.RETURNS_CREATE, PERMISSIONS.RETURNS_UPDATE, PERMISSIONS.RETURNS_DELETE],
    'Users & Roles': [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE, PERMISSIONS.ROLES_MANAGE],
    'Reports': [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_EXPORT],
    'Activity / Audit': [PERMISSIONS.ACTIVITY_READ],
  };

  const roleDescriptions = {
    SUPER_ADMIN: 'Full system access. Sees all activity and is the only role allowed to manage roles, companies, and departments.',
    DEPARTMENT_USER: 'Department-based user (Supervisor, Accountant, Driver, etc.). Permissions are the same for all departments; department is only for classification.',
  };

  const hasPermission = (role, permission) => {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Role & Department Model</h2>
        <p className="text-gray-600 text-sm mt-1">
          Only SUPER_ADMIN has a system role. All other users are department-based (Supervisor, Accountant, Driver, etc.) and share the same permissions.
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> Role permissions are predefined by the system. Contact your system administrator to customize roles.
        </p>
      </div>

      {/* Roles Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`p-3 rounded-lg font-medium text-sm transition ${selectedRole === role
              ? `${roleColors[role]} ring-2 ring-offset-2 ring-current`
              : `${roleColors[role]} opacity-60 hover:opacity-100`
              }`}
          >
            {ROLE_LABELS[role] || role}
          </button>
        ))}
      </div>

      {/* Role Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Role Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className={`${roleColors[selectedRole]} p-3 rounded-lg`}>
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{ROLE_LABELS[selectedRole] || selectedRole}</h3>
            <p className="text-gray-600 text-sm mt-1">{roleDescriptions[selectedRole]}</p>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="space-y-6">
          {Object.entries(permissionCategories).map(([category, permissions]) => (
            <div key={category}>
              <h4 className="font-semibold text-lg mb-3 text-gray-800">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions.map((permission) => {
                  const hasIt = hasPermission(selectedRole, permission);
                  return (
                    <div
                      key={permission}
                      className={`p-3 rounded-lg border-2 flex items-center gap-2 ${hasIt
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                        }`}
                    >
                      {hasIt ? (
                        <Check className="text-green-600 flex-shrink-0" size={20} />
                      ) : (
                        <X className="text-red-600 flex-shrink-0" size={20} />
                      )}
                      <span
                        className={`text-sm ${hasIt ? 'text-green-700 font-medium' : 'text-red-700 line-through'
                          }`}
                      >
                        {permission.replace(':', ' - ').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <strong>Total Permissions:</strong>{' '}
            <span className="font-semibold text-blue-600">
              {ROLE_PERMISSIONS[selectedRole]?.length || 0}
            </span>
          </p>
        </div>
      </div>

      {/* Role Hierarchy */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Role Hierarchy</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className={`${roleColors['SUPER_ADMIN']} px-3 py-1 rounded-full text-xs font-medium`}>
              {ROLE_LABELS.SUPER_ADMIN}
            </div>
            <span className="text-gray-600 text-sm">Highest level - Full access, can see all activity and change role permissions</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`${roleColors['DEPARTMENT_USER']} px-3 py-1 rounded-full text-xs font-medium`}>
              {ROLE_LABELS.DEPARTMENT_USER}
            </div>
            <span className="text-gray-600 text-sm">
              Department users (Supervisor, Accountant, Driver, etc.) – same permissions, department is for classification and reporting only.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
