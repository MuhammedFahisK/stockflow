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
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.INCOMING_READ,
    PERMISSIONS.INCOMING_CREATE,
    PERMISSIONS.INCOMING_UPDATE,
    PERMISSIONS.INCOMING_DELETE,
    PERMISSIONS.OUTGOING_READ,
    PERMISSIONS.OUTGOING_CREATE,
    PERMISSIONS.OUTGOING_UPDATE,
    PERMISSIONS.OUTGOING_DELETE,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_CREATE,
    PERMISSIONS.RETURNS_UPDATE,
    PERMISSIONS.RETURNS_DELETE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.COMPANIES_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  MANAGER: [
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
    PERMISSIONS.REPORTS_READ,
  ],
  OPERATOR: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INCOMING_READ,
    PERMISSIONS.INCOMING_CREATE,
    PERMISSIONS.OUTGOING_READ,
    PERMISSIONS.OUTGOING_CREATE,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.RETURNS_CREATE,
    PERMISSIONS.REPORTS_READ,
  ],
  VIEWER: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INCOMING_READ,
    PERMISSIONS.OUTGOING_READ,
    PERMISSIONS.RETURNS_READ,
    PERMISSIONS.REPORTS_READ,
  ],
};

// Display labels for roles in the UI
export const ROLE_LABELS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'OPERATOR',
  MANAGER: 'MANAGER',
  OPERATOR: 'SUPERVISOR',
  VIEWER: 'VIEWER',
};

export const hasPermission = (userRole, permission) => {
  // Until full role management is wired to the backend,
  // treat missing roles as having access to all features.
  if (!userRole) {
    return true;
  }

  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const canAccess = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};
