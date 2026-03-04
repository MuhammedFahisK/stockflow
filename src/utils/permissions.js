export const PERMISSIONS = {
  // Products
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Incoming Stock
  INCOMING_READ: 'incoming:read',
  INCOMING_CREATE: 'incoming:create',
  INCOMING_UPDATE: 'incoming:update',
  INCOMING_DELETE: 'incoming:delete',

  // Outgoing Stock
  OUTGOING_READ: 'outgoing:read',
  OUTGOING_CREATE: 'outgoing:create',
  OUTGOING_UPDATE: 'outgoing:update',
  OUTGOING_DELETE: 'outgoing:delete',

  // Returns
  RETURNS_READ: 'returns:read',
  RETURNS_CREATE: 'returns:create',
  RETURNS_UPDATE: 'returns:update',
  RETURNS_DELETE: 'returns:delete',

  // Users & Roles
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  ROLES_MANAGE: 'roles:manage',

  // Companies
  COMPANIES_MANAGE: 'companies:manage',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Activity / audit
  ACTIVITY_READ: 'activity:read',

  // Departments
  DEPARTMENTS_MANAGE: 'departments:manage',
};

// Default departments used to classify non-super admin users
export const DEFAULT_DEPARTMENTS = ['Supervisor', 'Accountant', 'Driver', 'Supply Chain Exec'];

export const DEFAULT_UNITS = ['Pcs', 'Box', 'Kg', 'Ltr', 'Mtr', 'Pkt', 'Set'];

export const ROLE_PERMISSIONS = {
  // Only SUPER_ADMIN has a separate role; all other users are handled as department-based users
  SUPER_ADMIN: Object.values(PERMISSIONS),
  DEPARTMENT_USER: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INCOMING_READ,
    PERMISSIONS.INCOMING_CREATE,
    PERMISSIONS.INCOMING_UPDATE,
    PERMISSIONS.OUTGOING_READ,
    PERMISSIONS.OUTGOING_CREATE,
    PERMISSIONS.OUTGOING_UPDATE,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_CREATE,
    PERMISSIONS.RETURNS_UPDATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DEPARTMENTS_MANAGE,
  ],
};

// Display labels for roles in the UI
export const ROLE_LABELS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEPARTMENT_USER: 'Department User',
};

export const hasPermission = (userRole, permission) => {
  if (!userRole) {
    return false;
  }

  // Custom per-user permission array (when stored in Firestore as a JSON string)
  if (Array.isArray(userRole)) {
    return userRole.includes(permission);
  }

  // Backwards compatibility: legacy roles (ADMIN, MANAGER, OPERATOR, VIEWER)
  // are treated as department users for permission checks.
  const effectiveRole = ROLE_PERMISSIONS[userRole]
    ? userRole
    : userRole === 'SUPER_ADMIN'
      ? 'SUPER_ADMIN'
      : 'DEPARTMENT_USER';

  const permissions = ROLE_PERMISSIONS[effectiveRole] || [];
  return permissions.includes(permission);
};

export const canAccess = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};
