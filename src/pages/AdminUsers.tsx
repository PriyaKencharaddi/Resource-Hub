import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { Shield, Users } from 'lucide-react';

type AppUser = {
  uid: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  semester?: number;
  subjects?: string[];
  blocked?: boolean;
};

const AdminUsers: React.FC = () => {
  const { userProfile } = useAuth();
  const ADMIN_EMAIL = 'sksvmacet@gmail.com';

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (userProfile.role !== 'admin' || userProfile.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <Shield className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Unauthorized</h2>
          <p className="text-gray-600 text-sm">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(query(collection(db, 'users')));
        const list: AppUser[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        setUsers(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleBlockUser = async (u: AppUser) => {
    await updateDoc(doc(db, 'users', u.uid), { blocked: !u.blocked });
    setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, blocked: !u.blocked } : x)));
  };

  const deleteUser = async (u: AppUser) => {
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    await deleteDoc(doc(db, 'users', u.uid));
    setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2" /> User Management
          </h1>
          <Link to="/admin-dashboard" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Users</h3>
            {loading && <span className="text-xs sm:text-sm text-gray-500">Loading...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Semester/Subjects</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{u.username}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 capitalize">{u.role}</td>
                    <td className="px-3 py-2">
                      {u.role === 'student' ? (
                        <span>Sem {u.semester ?? '-'}</span>
                      ) : u.role === 'teacher' ? (
                        <span>{(u.subjects || []).join(', ') || '-'}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => toggleBlockUser(u)}
                        className={`px-3 py-1.5 rounded-md ${u.blocked ? 'bg-green-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {u.blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;


