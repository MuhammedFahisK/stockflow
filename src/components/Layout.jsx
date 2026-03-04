import React from "react";
import ResponsiveSidebar from "./ResponsiveSidebar";
import TopNav from "./TopNav";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ResponsiveSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-20 sm:px-6 lg:px-10 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}