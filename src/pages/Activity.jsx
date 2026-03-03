import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { PERMISSIONS, hasPermission } from '../utils/permissions';

export default function Activity() {
  const { userRole, userCompany } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasPermission(userRole, PERMISSIONS.ACTIVITY_READ)) {
      setError('You do not have permission to view activity logs.');
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      try {
        // super admin sees all logs; others could be limited to their company (not currently used)
        const logsQuery = query(
          collection(db, 'activityLogs'),
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const snapshot = await getDocs(logsQuery);
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLogs(items);
      } catch (e) {
        console.error('Failed to load activity logs', e);
        setError('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [userRole]);

  if (loading) {
    return <p>Loading activity...</p>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Activity Log</h1>
      {logs.length === 0 ? (
        <p className="text-gray-600">No activity logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : ''}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.userId || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.company || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.action}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.details || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}