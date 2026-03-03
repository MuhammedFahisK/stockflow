import React from "react";
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Users,
  Shield,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium";

  return (
    <div className="w-64 bg-white border-r p-5 hidden md:block">
      <h1 className="text-xl font-semibold mb-8">StockFlow</h1>

      <nav className="flex flex-col gap-2">
        <NavLink to="/" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/products" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <Package size={18} />
          Products
        </NavLink>

        <NavLink to="/incoming" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <ArrowDownCircle size={18} />
          Incoming Stock
        </NavLink>

        <NavLink to="/outgoing" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <ArrowUpCircle size={18} />
          Outgoing Stock
        </NavLink>

        <NavLink to="/returns" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <RotateCcw size={18} />
          Returns
        </NavLink>

        <NavLink to="/users" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <Users size={18} />
          Users
        </NavLink>

        <NavLink to="/roles" className={({ isActive }) =>
          `${linkClass} ${isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`
        }>
          <Shield size={18} />
          Roles
        </NavLink>
      </nav>

      <div className="mt-auto pt-10">
        <button className="flex items-center gap-3 text-red-500 text-sm">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}