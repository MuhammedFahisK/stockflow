import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronDown, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopNav() {
    const { user, userName, userCompany } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 md:left-64 z-30 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                    {userCompany && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                                {userCompany.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-700">{userCompany}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center relative">
                    <Search className="absolute left-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                    />
                </div>


                <Link to="/profile" className="flex items-center gap-3 p-1 pl-3 pr-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group">
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-blue-600 transition-colors">
                            {userName || 'User'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium tracking-tight mt-0.5">
                            Account detail
                        </p>
                    </div>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>
            </div>
        </header>
    );
}
