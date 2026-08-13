 import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Upload, Download, Search, Filter, FileText, Code, Calculator,Trash2, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  collection,
  orderBy,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuth();

   const categories = [
    { icon: <FileText className="h-6 w-6" />, name: 'Notes', color: 'bg-blue-100 text-blue-600' },
    { icon: <Code className="h-6 w-6" />, name: 'Lab Manuals', color: 'bg-green-100 text-green-600' },
    { icon: <Calculator className="h-6 w-6" />, name: 'Question Papers', color: 'bg-purple-100 text-purple-600' },
    { icon: <BookOpen className="h-6 w-6" />, name: 'Text Books', color: 'bg-orange-100 text-orange-600' },
  ];

  // --- Handle Unavailable Profile ---
  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Type definitions ---
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
    uploadedAt?: { seconds: number; nanoseconds: number } | Date;
  };

  const studentUser = userProfile as any;

  // --- States ---
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [recentDownloads, setRecentDownloads] = useState<any[]>([]);
  const [filterSemester, setFilterSemester] = useState<number | ''>('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterTerm, setFilterTerm] = useState<'odd' | 'even' | ''>('');
  const [filterType, setFilterType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- Auto-set default semester ---
  useEffect(() => {
    if (studentUser?.semester) setFilterSemester(studentUser.semester);
  }, [studentUser]);

  // --- Real-time Resources ---
  useEffect(() => {
    setIsLoadingResources(true);
    const qRef = query(collection(db, 'resources'));
    const unsubscribe = onSnapshot(
      qRef,
      (snap) => {
        const items: Resource[] = snap.docs.map((d) => {
          const data: any = d.data();
          // Normalize semester from various possible fields
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
          const resource: Resource = {
            id: d.id,
            ...data,
            semester: semesterNumber,
          };
          return resource;
        });
        // Local sort by uploadedAt desc (supports Firestore Timestamp or Date)
        items.sort((a: any, b: any) => {
          const aMs = a?.uploadedAt?.seconds
            ? a.uploadedAt.seconds * 1000
            : (a?.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0);
          const bMs = b?.uploadedAt?.seconds
            ? b.uploadedAt.seconds * 1000
            : (b?.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0);
          return bMs - aMs;
        });
        setResources(items);
        setIsLoadingResources(false);
      },
      () => {
        setIsLoadingResources(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Real-time Listener for Downloads ---
  useEffect(() => {
    if (!studentUser?.uid) return;
    const downloadsRef = query(
      collection(db, 'users', studentUser.uid, 'downloads'),
      orderBy('downloadedAt', 'desc')
    );
    const unsub = onSnapshot(downloadsRef, (snap) => {
      setDownloadCount(snap.size);
      setRecentDownloads(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [studentUser?.uid]);

  // --- Filtering Logic ---
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesSem = filterSemester ? r.semester === Number(filterSemester) : true;
      const matchesSubj = filterSubject
        ? r.subject.toLowerCase().includes(filterSubject.toLowerCase())
        : true;
      const matchesYear = filterYear
        ? r.academicYear.toLowerCase().includes(filterYear.toLowerCase())
        : true;
      const matchesTerm = filterTerm ? r.term === filterTerm : true;
      const ft = filterType.toLowerCase();
      const matchesType = ft
        ? ft === 'image'
          ? r.fileType?.startsWith('image/')
          : r.fileType?.toLowerCase().includes(ft) ||
            r.fileName?.toLowerCase().endsWith(ft)
        : true;
      return matchesSem && matchesSubj && matchesYear && matchesTerm && matchesType;
    });
  }, [resources, filterSemester, filterSubject, filterYear, filterTerm, filterType]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / pageSize));
  const paginatedResources = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, page, pageSize]);

  useEffect(() => setPage(1), [filterSemester, filterSubject, filterYear, filterTerm, filterType, pageSize]);

  // --- Helpers ---
  const logDownload = async (r: Resource) => {
    if (!studentUser?.uid) return;
    try {
      await addDoc(collection(db, 'users', studentUser.uid, 'downloads'), {
        resourceId: r.id,
        fileName: r.fileName,
        subject: r.subject,
        semester: r.semester,
        fileUrl: r.fileUrl,
        fileType: r.fileType,
        downloadedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'resources', r.id), { downloads: increment(1) });
    } catch (error) {
      console.error('Error logging download:', error);
    }
  };

  // --- Stats + Actions ---
   const stats = [
  { label: 'Resources Uploaded', value: '8', icon: <Upload className="h-5 w-5" />, color: 'bg-green-100 text-green-600' },
  { label: 'Current Semester', value: studentUser.semester, icon: <BookOpen className="h-5 w-5" />, color: 'bg-purple-100 text-purple-600' },
];


  const quickActions = [
  { 
    title: 'Browse Resources', 
    description: 'Find study materials for your semester', 
    icon: <BookOpen className="h-6 w-6" />, 
    href: '/resources', 
    color: 'bg-blue-500' 
  },
];


  // --- UI ---
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* --- Header --- */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {userProfile.username}! 👋</h1>
                <p className="text-sm sm:text-lg opacity-90 mb-3 sm:mb-4">Ready to continue your CSE journey?</p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-80">
                  <span>USN: {studentUser.usn}</span>
                  <span>•</span>
                  <span>Semester: {studentUser.semester}</span>
                  <span>•</span>
                  <span>Branch: CSE{studentUser.branch}</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 sm:p-4 rounded-full backdrop-blur-sm hidden sm:block">
                <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
              </div>
            </div>
          </div>
  

{/* --- Stats --- */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
  {stats.map((s, i) => (
    <div key={i} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{s.label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-full ${s.color}`}>{s.icon}</div>
      </div>
    </div>
  ))}

  {/* Browse Resources Card */}
  <Link
    to="/resources"
    className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow flex items-center justify-between cursor-pointer"
  >
    <div>
      <p className="text-xs sm:text-sm font-medium text-gray-600">Browse Resources</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">Access Now</p>
    </div>
    <div className="p-2.5 sm:p-3 rounded-full bg-blue-100 text-blue-600">
      <Search className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  </Link>
</div>



          {/* --- Study Categories --- */}
<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Study Categories</h2>
<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10">
  {categories.map((cat, i) => (
    <div
      key={i}
      className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center group"
    >
      <div
        className={`${cat.color} w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
      >
        {cat.icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">
        {cat.name}
      </h3>
      <p className="text-gray-600 text-xs sm:text-sm">Explore {cat.name.toLowerCase()} shared by faculty</p>
    </div>
  ))}
</div>


          {/* --- Campus Resources --- */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 mb-12 w-full">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Campus Resources</h3>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">All Semesters</option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Subject" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} />
              <input className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Academic Year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterTerm} onChange={(e) => setFilterTerm(e.target.value as any)}>
                <option value="">Odd/Even</option>
                <option value="odd">Odd</option>
                <option value="even">Even</option>
              </select>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="ppt">PPT</option>
                <option value="doc">DOC</option>
                <option value="image">Images</option>
              </select>
            </div>

            {/* Resources Table */}
            {isLoadingResources ? (
              <div className="text-sm text-gray-500">Loading resources...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Title', 'Subject', 'Sem', 'Year', 'Term', 'Type', 'Uploaded', ''].map((h, i) => (
                        <th key={i} className="px-3 sm:px-4 py-2 text-left font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedResources.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-2 font-medium text-gray-900 truncate max-w-[160px] sm:max-w-[260px]">{r.fileName}</td>
                        <td className="px-3 sm:px-4 py-2">{r.subject}</td>
                        <td className="px-3 sm:px-4 py-2">{r.semester}</td>
                        <td className="px-3 sm:px-4 py-2">{r.academicYear}</td>
                        <td className="px-3 sm:px-4 py-2 capitalize">{r.term}</td>
                        <td className="px-3 sm:px-4 py-2">{r.fileType?.split('/')[1]?.toUpperCase() || 'File'}</td>
                        <td className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-gray-600 whitespace-nowrap">
                          {r.uploadedAt && 'seconds' in (r.uploadedAt as any)
                            ? new Date((r.uploadedAt as any).seconds * 1000).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {(() => {
                              const fileTypeLower = (r.fileType || '').toLowerCase();
                              const fileNameLower = (r.fileName || '').toLowerCase();
                              const isPdf = fileTypeLower.includes('pdf') || fileNameLower.endsWith('.pdf');
                              const directUrl = r.fileUrl;
                              
                              if (!directUrl) {
                                return <span className="text-gray-400 text-xs">No URL</span>;
                              }
                              
                              return (
                                <>
                                  <a 
                                    href={directUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer p-1"
                                    title="Download/Open"
                                    onClick={() => {
                                      logDownload(r);
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                  {isPdf && (
                                    <a
                                      href={directUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-green-600 hover:text-green-900 transition-colors cursor-pointer p-1"
                                      title="View PDF"
                                    >
                                      <BookOpen className="h-4 w-4" />
                                    </a>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredResources.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-6 text-gray-500">No resources found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border rounded-md disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                  <button className="px-3 py-1.5 border rounded-md disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
