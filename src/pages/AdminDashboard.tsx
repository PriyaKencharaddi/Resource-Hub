import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, FileText, AlertTriangle, CheckCircle, Activity, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteFromCloudinaryByToken } from '../utils/cloudinary';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const ADMIN_EMAIL = 'sksvmacet@gmail.com';

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Enforce that only the single allowed admin email can access this page
  if (userProfile.role !== 'admin' || userProfile.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <Shield className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Unauthorized</h2>
          <p className="text-gray-600 text-sm">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const adminUser = userProfile as any; // Type assertion for admin-specific fields

  // Data state
  type AppUser = {
    uid: string;
    username: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    semester?: number;
    subjects?: string[];
    blocked?: boolean;
  };
  type Resource = {
    
    id: string;
    teacherId: string;
    teacherName: string;
    semester: number;
    subject: string;
    academicYear: string;
    term: 'odd' | 'even';
    fileUrl: string;
    filePath: string;
    fileName: string;
    fileType: string;
    uploadedAt?: any;
  };

  const [users, setUsers] = useState<AppUser[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const uploadsPerSem = useMemo(() => {
    const counts = new Array(8).fill(0);
    for (const r of resources) {
      if (r.semester >= 1 && r.semester <= 8) counts[r.semester - 1]++;
    }
    return counts;
  }, [resources]);
  const uploadsPerTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) {
      const role = (r as any).role;
      const nameRaw = (r as any).teacherName || (role === 'admin' ? 'Admin' : (r as any).uploadedByName) || 'Unknown';
      const name = String(nameRaw).trim() || 'Unknown';
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [resources]);
  const topDownloads = useMemo(() => {
    return [...resources]
      .sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 10);
  }, [resources]);

  useEffect(() => {
    let unsubscribeResources: (() => void) | null = null;
    const init = async () => {
      try {
        setLoadingUsers(true);
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData: AppUser[] = usersSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        setUsers(usersData);
      } finally {
        setLoadingUsers(false);
      }

      setLoadingResources(true);
      const resCol = collection(db, 'resources');
      unsubscribeResources = onSnapshot(
        resCol,
        (resSnap) => {
          const resData: Resource[] = resSnap.docs.map((d) => {
            const data: any = d.data();
            // Try multiple possible semester fields
            const rawSemester = (
              data.semester ??
              data.sem ??
              data.semesterNo ??
              data.semNo ??
              data.semester_number ??
              data.semesterIndex
            );
            let semesterNumber: number;
            if (typeof rawSemester === 'number') {
              semesterNumber = rawSemester;
            } else {
              const match = String(rawSemester ?? '').match(/\d+/);
              semesterNumber = match ? parseInt(match[0], 10) : 0;
            }
            if (semesterNumber < 1 || semesterNumber > 8) {
              semesterNumber = 0;
            }
            return {
              id: d.id,
              ...data,
              semester: semesterNumber,
            } as Resource;
          });
          // Optional: sort locally by uploadedAt desc if present
          resData.sort((a: any, b: any) => {
            const aMs = a?.uploadedAt?.seconds ? a.uploadedAt.seconds * 1000 : (a?.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0);
            const bMs = b?.uploadedAt?.seconds ? b.uploadedAt.seconds * 1000 : (b?.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0);
            return bMs - aMs;
          });
          setResources(resData);
          setLoadingResources(false);
        },
        () => {
          setLoadingResources(false);
        }
      );
    };
    init();
    return () => {
      if (unsubscribeResources) unsubscribeResources();
    };
  }, []);

  const groupedBySemSubject = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const r of resources) {
      const key = `Sem ${r.semester} • ${r.subject}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [resources]);

  const toggleBlockUser = async (u: AppUser) => {
    await updateDoc(doc(db, 'users', u.uid), { blocked: !u.blocked });
    setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, blocked: !u.blocked } : x)));
  };
  const deleteUser = async (u: AppUser) => {
    if (!window.confirm(`Delete user ${u.username} and all their resources?`)) return;
    // Delete Firestore user profile
    await deleteDoc(doc(db, 'users', u.uid));
    setUsers((prev) => prev.filter((x) => x.uid !== u.uid));

    // Also delete this user's resources and Cloudinary files
    const resQ = query(collection(db, 'resources'), where('teacherId', '==', u.uid));
    const resSnap = await getDocs(resQ);
    const deletions: Promise<any>[] = [];
    resSnap.forEach((d) => {
      const data = d.data() as any;
      if (data.deleteToken) {
        deletions.push(deleteFromCloudinaryByToken(data.deleteToken).catch(() => {}));
      }
      deletions.push(deleteDoc(doc(db, 'resources', d.id)));
    });
    await Promise.all(deletions);
  };
  const deleteResource = async (r: Resource) => {
    if (!window.confirm(`Delete resource "${r.fileName}"?`)) return;
    // Delete Cloudinary asset first (best-effort)
    if ((r as any).deleteToken) {
      try { await deleteFromCloudinaryByToken((r as any).deleteToken); } catch (_) {}
    }
    await deleteDoc(doc(db, 'resources', r.id));
    setResources((prev) => prev.filter((x) => x.id !== r.id));
  };

  // Calculate real-time stats
  const totalUsers = users.length;
  const totalResources = resources.length;

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), icon: <Users className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600', change: '+12%' },
    { label: 'Total Resources', value: totalResources.toLocaleString(), icon: <FileText className="h-5 w-5" />, color: 'bg-green-100 text-green-600', change: '+8%' },
  ];

  const quickActions = [
    { title: 'Upload Resources', description: 'Upload campus resources as admin', icon: <Upload className="h-6 w-6" />, href: '/admin/upload', color: 'bg-green-500' },
    { title: 'User Management', description: 'Manage users and permissions', icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-blue-500' },
  ];

  const recentActivity = [
    { action: 'New user registered', details: 'John Doe (Student)', time: '5 minutes ago', icon: <Users className="h-4 w-4" />, color: 'bg-blue-100 text-blue-600' },
    { action: 'Resource flagged', details: 'Inappropriate content reported', time: '15 minutes ago', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-100 text-red-600' },
    { action: 'Teacher approved', details: 'Dr. Smith verification complete', time: '1 hour ago', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-600' },
    { action: 'System backup', details: 'Daily backup completed', time: '2 hours ago', icon: <Activity className="h-4 w-4" />, color: 'bg-purple-100 text-purple-600' },
  ];

  const pendingApprovals = [
    { type: 'Teacher Registration', name: 'Dr. Sarah Johnson', subject: 'Machine Learning', priority: 'high' },
    { type: 'Resource Upload', name: 'Advanced Algorithms PDF', uploader: 'Mike Chen', priority: 'medium' },
    { type: 'User Report', name: 'Inappropriate behavior', reporter: 'Anonymous', priority: 'high' },
    { type: 'Content Update', name: 'Database Systems Notes', uploader: 'Prof. Williams', priority: 'low' },
  ];

  // Calculate real-time user distribution
  const userBreakdown = useMemo(() => {
    const students = users.filter(u => u.role === 'student').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const total = students + teachers + admins;
    
    if (total === 0) {
      return [
        { role: 'Students', count: 0, percentage: 0, color: 'bg-blue-500' },
        { role: 'Teachers', count: 0, percentage: 0, color: 'bg-green-500' },
        { role: 'Admins', count: 0, percentage: 0, color: 'bg-purple-500' },
      ];
    }
    
    return [
      { role: 'Students', count: students, percentage: Math.round((students / total) * 100), color: 'bg-blue-500' },
      { role: 'Teachers', count: teachers, percentage: Math.round((teachers / total) * 100), color: 'bg-green-500' },
      { role: 'Admins', count: admins, percentage: Math.round((admins / total) * 100), color: 'bg-purple-500' },
    ];
  }, [users]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard 🛡️</h1>
              <p className="text-sm sm:text-lg opacity-90 mb-3 sm:mb-4">Welcome, {userProfile.username}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-80">
                <span>Role: System Administrator</span>
                <span>•</span>
                <span>Last login: Today</span>
              </div>
            </div>
            <div className="bg-white/20 p-3 sm:p-4 rounded-full backdrop-blur-sm hidden sm:block">
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2.5 sm:p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 
                  stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className={`${action.color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </Link>
              ))}
            </div>

            {/* Users Management */}
             

            {/* Resources Management */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Resources</h3>
                {loadingResources && <span className="text-sm text-gray-500">Loading...</span>}
              </div>
              {groupedBySemSubject.map(([group, items]) => (
                <div key={group} className="mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{group}</h4>
                    <span className="text-xs text-gray-500">{items.length} item(s)</span>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Title</th>
                          <th className="px-3 py-2 text-left">Role</th>
                          <th className="px-3 py-2 text-left">Year</th>
                          <th className="px-3 py-2 text-left">Term</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 truncate max-w-[260px]">{r.fileName}</td>
                            <td className="px-3 py-2">{(users.find(u => u.uid === r.teacherId)?.role) || (r as any).role || 'teacher'}</td>
                            <td className="px-3 py-2">{r.academicYear}</td>
                            <td className="px-3 py-2 capitalize">{r.term}</td>
                            <td className="px-3 py-2">{r.fileType?.split('/')[1]?.toUpperCase() || 'File'}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => deleteResource(r)}
                                className="px-3 py-1.5 rounded-md bg-red-400 hover:bg-red-500 text-white"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {resources.length === 0 && (
                <div className="text-sm text-gray-500">No resources found.</div>
              )}
            </div>
            {/* User Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h3>
              <div className="space-y-4">
                {userBreakdown.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${user.color}`}></div>
                      <span className="font-medium text-gray-900">{user.role}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">{user.count}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${user.color}`} 
                          style={{ width: `${user.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{user.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
             
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Uploads per Semester</h3>
              <div className="grid grid-cols-4 gap-3 text-sm">
                {uploadsPerSem.map((c, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Sem {i + 1}</div>
                    <div className="text-lg font-semibold text-gray-900">{c}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Downloaded</h3>
  <div className="space-y-3 text-sm">
    {topDownloads.map((r) => (
      <div key={r.id} className="flex items-center justify-between">
        <span className="truncate max-w-[180px]">{r.fileName}</span>
      </div>
    ))}
    {topDownloads.length === 0 && (
      <div className="text-gray-500 text-sm">No data</div>
    )}
  </div>
</div>

            {/* Pending Approvals */}
 

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Firestore</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Storage</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Authentication</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cloudinary</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Faculty Resource Count */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <h3 className="font-bold">Faculty Resources</h3>
              <div className="text-white/80 text-xs mb-3">Includes resources shared by Admin</div>
              <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {uploadsPerTeacher.length > 0 ? (
                  uploadsPerTeacher.map(([teacherName, count]) => (
                    <div key={teacherName} className="flex justify-between items-center">
                      <span className="truncate max-w-[140px]" title={teacherName}>{teacherName}</span>
                      <span className="font-semibold bg-white/20 px-2 py-1 rounded-full text-xs">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/70 py-4">
                    No faculty resources yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;