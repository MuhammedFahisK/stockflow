import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 p-3 rounded-lg">
            <AlertCircle className="text-white" size={32} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator.
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
