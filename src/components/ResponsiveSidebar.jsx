import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Users,
  Shield,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../utils/permissions';
import LogoMark from './LogoMark';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);

  const { user, userRole, userCompany, companies, setActiveCompany, createCompany, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // record activity before signing out
    try {
      await import('../utils/activityLogger').then((m) => {
        m.logActivity({ userId: user?.uid || null, company: userCompany, action: 'logout' });
      });
    } catch (e) {
      console.warn('failed to log logout', e);
    }
    await logout();
    navigate('/login');
  };

  const linkClass =
    'flex items-center gap-3 px-4 py-3 text-gray-700 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100';

  const navItems = [
    {
      label: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      permission: null,
    },
    {
      label: 'Products',
      to: '/products',
      icon: Package,
      permission: PERMISSIONS.PRODUCT_READ,
    },
    {
      label: 'Incoming Stock',
      to: '/incoming',
      icon: ArrowDownCircle,
      permission: PERMISSIONS.INCOMING_READ,
    },
    {
      label: 'Outgoing Stock',
      to: '/outgoing',
      icon: ArrowUpCircle,
      permission: PERMISSIONS.OUTGOING_READ,
    },
    {
      label: 'Returns',
      to: '/returns',
      icon: RotateCcw,
      permission: PERMISSIONS.RETURNS_READ,
    },
    {
      label: 'Users',
      to: '/users',
      icon: Users,
      permission: PERMISSIONS.USERS_READ,
    },
    {
      label: 'Roles',
      to: '/roles',
      icon: Shield,
      permission: PERMISSIONS.ROLES_MANAGE,
    },
    {
      label: 'Activity Log',
      to: '/activity',
      icon: Activity,
      permission: PERMISSIONS.ACTIVITY_READ,
    },
    {
      label: 'Companies',
      to: '/companies',
      icon: Building2,
      permission: null, // visible to all; only SUPER_ADMIN sees Add button
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(userRole, item.permission)
  );

  const companyList = useMemo(() => {
    const list = companies?.length ? companies : userCompany ? [userCompany] : [];
    return Array.from(new Set(list)).filter(Boolean);
  }, [companies, userCompany]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 hover:bg-gray-100 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative w-64 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">StockFlow</h1>
              <p className="text-xs text-gray-500 leading-tight">Inventory</p>
            </div>
          </div>

          <div className="mt-4 relative">
            <button
              type="button"
              onClick={() => setCompanyMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium text-gray-700 truncate">
                {userCompany || 'Select company'}
              </span>
              <ChevronDown size={16} className="text-gray-600 shrink-0" />
            </button>

            {companyMenuOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="max-h-56 overflow-y-auto">
                  {companyList.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No companies yet</div>
                  ) : (
                    companyList.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setActiveCompany(name);
                          setCompanyMenuOpen(false);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${name === userCompany ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                          }`}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>

                {hasPermission(userRole, PERMISSIONS.COMPANIES_MANAGE) && (
                  <div className="border-t border-gray-200 p-2">
                    {!addCompanyOpen ? (
                      <button
                        type="button"
                        onClick={() => setAddCompanyOpen(true)}
                        className="w-full px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-md transition"
                      >
                        + Add company
                      </button>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            setCreatingCompany(true);
                            await createCompany(newCompanyName);
                            setNewCompanyName('');
                            setAddCompanyOpen(false);
                            setCompanyMenuOpen(false);
                          } finally {
                            setCreatingCompany(false);
                          }
                        }}
                        className="space-y-2"
                      >
                        <input
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Company name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={creatingCompany}
                            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creatingCompany ? 'Adding…' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddCompanyOpen(false);
                              setNewCompanyName('');
                            }}
                            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${linkClass} ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-100'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
