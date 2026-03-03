import React from "react";
import ResponsiveSidebar from "./ResponsiveSidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ResponsiveSidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 mt-16 md:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}