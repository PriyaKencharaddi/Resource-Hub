import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, FileText, Code, Calculator, BookOpen, Trash2, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getUserRole } from '../utils/getUserRole';
import { deleteFromCloudinaryByToken } from '../utils/cloudinary';

const Resources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const categories = [
    { icon: <FileText className="h-6 w-6" />, name: 'Notes', color: 'bg-blue-100 text-blue-600' },
    { icon: <Code className="h-6 w-6" />, name: 'Lab Manuals', color: 'bg-green-100 text-green-600' },
    { icon: <Calculator className="h-6 w-6" />, name: 'Question Papers', color: 'bg-purple-100 text-purple-600' },
    { icon: <BookOpen className="h-6 w-6" />, name: 'Text Books', color: 'bg-orange-100 text-orange-600' },
  ];

  type Role = 'admin' | 'teacher' | 'student';
  type Resource = {
    id: string;
    teacherId?: string;
    teacherName?: string;
    semester: number;
    subject: string;
    subjectCode?: string;
    academicYear: string;
    term: 'odd' | 'even';
    fileUrl: string;
    fileName: string;
    fileType: string;
    downloads?: number;
    uploadedAt?: any;
    uploadedBy?: string | null;
    deleteToken?: string | null;
  };

  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const user = auth.currentUser;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const term = params.get('term');

  useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      if (!user?.uid) {
        setRole(null);
        return;
      }
      try {
        const r = await getUserRole(user.uid);
        if (!mounted) return;
        setRole((r as Role) || null);
      } catch {
        if (!mounted) return;
        setRole(null);
      }
    };
    loadRole();
    return () => { mounted = false; };
  }, [user?.uid]);

  const canDelete = React.useCallback((r: Resource): boolean => {
    if (!role) return false;
    if (role === 'admin') return true;
    if (role === 'teacher') return (r.uploadedBy && user?.uid) ? r.uploadedBy === user.uid : false;
    return false;
  }, [role, user?.uid]);

  const toggleFolder = (subjectCode: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(subjectCode)) {
      newExpanded.delete(subjectCode);
    } else {
      newExpanded.add(subjectCode);
    }
    setExpandedFolders(newExpanded);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(query(collection(db, 'resources')));
        const list: Resource[] = snap.docs.map((d) => {
          const data: any = d.data();
          const normalized: Resource = {
            id: d.id,
            teacherId: data.teacherId,
            teacherName: data.teacherName || (data.role === 'admin' ? 'Admin' : data.teacherName),
            semester: Number(data.semester) || 0,
            subject: data.subject || '',
            subjectCode: data.subjectCode || '',
            academicYear: data.academicYear || '',
            term: data.term as 'odd' | 'even',
            fileUrl: data.fileUrl || data.url,
            fileName: data.fileName || data.originalFilename || 'Untitled',
            fileType: data.fileType || data.format || 'file',
            downloads: data.downloads || 0,
            uploadedAt: data.uploadedAt || data.timestamp || null,
            uploadedBy: data.uploadedBy || data.teacherId || null,
            deleteToken: data.deleteToken || null,
          };
          return normalized;
        });
        list.sort((a, b) => {
          const aMs = a.uploadedAt?.seconds !== undefined
            ? a.uploadedAt.seconds * 1000
            : (a.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0);
          const bMs = b.uploadedAt?.seconds !== undefined
            ? b.uploadedAt.seconds * 1000
            : (b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0);
          return bMs - aMs;
        });
        setItems(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = React.useCallback(async (r: Resource) => {
    if (!canDelete(r)) return;
    const confirmed = window.confirm(`Delete resource "${r.fileName}"?`);
    if (!confirmed) return;
    try {
      if (r.deleteToken) {
        try {
          await deleteFromCloudinaryByToken(r.deleteToken);
        } catch {
          // best effort
        }
      }
      await deleteDoc(doc(db, 'resources', r.id));
      setItems((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete. Please try again.');
    }
  }, [canDelete]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((r) => {
      const matchesTerm = term ? (term === 'odd' ? r.semester % 2 === 1 : r.semester % 2 === 0) : true;
      const matchesSemester = selectedSemester ? r.semester === selectedSemester : true;
      const fileTypeLower = (r.fileType || '').toLowerCase();
      const fileTypeShort = fileTypeLower.includes('/') ? fileTypeLower.split('/')[1] : fileTypeLower;
      const haystack = [
        r.fileName || '',
        r.subject || '',
        r.teacherName || '',
        r.subjectCode || '',
        r.academicYear || '',
        r.term || '',
        `sem ${r.semester}`,
        String(r.semester || ''),
        fileTypeLower,
        fileTypeShort,
      ].join(' ').toLowerCase();
      const matchesQuery = q ? haystack.includes(q) : true;
      return matchesTerm && matchesQuery && matchesSemester;
    });
  }, [items, searchQuery, term, selectedSemester]);

  const groupedResources = useMemo(() => {
    const groups: { [key: string]: Resource[] } = {};
    
    filtered.forEach((resource) => {
      const subjectCode = resource.subjectCode || 'NO_CODE';
      if (!groups[subjectCode]) {
        groups[subjectCode] = [];
      }
      groups[subjectCode].push(resource);
    });

    // Sort groups by subject code
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    
    return sortedGroups.map(([subjectCode, resources]) => ({
      subjectCode,
      resources: resources.sort((a, b) => {
        const aMs = a.uploadedAt?.seconds !== undefined
          ? a.uploadedAt.seconds * 1000
          : (a.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0);
        const bMs = b.uploadedAt?.seconds !== undefined
          ? b.uploadedAt.seconds * 1000
          : (b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0);
        return bMs - aMs;
      })
    }));
  }, [filtered]);

  // Auto-expand folders when resources change
  useEffect(() => {
    const newExpanded = new Set<string>();
    groupedResources.forEach(group => {
      newExpanded.add(group.subjectCode);
    });
    setExpandedFolders(newExpanded);
  }, [groupedResources]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Resources</h1>
          <p className="text-gray-600">Discover and download resources shared by CSE students</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* 🆕 Semester Dropdown */}
              <select
                value={selectedSemester ?? ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedSemester(isNaN(val) ? null : val);
                }}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[...Array(8)].map((_, i) => (
                  <option key={i} value={i + 1}>Semester {i + 1}</option>
                ))}
              </select>

              {/* Placeholder type filter */}
              <select className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="ppt">PPT</option>
                <option value="pptx">PPTX</option>
                <option value="doc">DOC</option>
                <option value="docx">DOCX</option>
                <option value="image">Images</option>
              </select>

              <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {/* Quick Odd/Even chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <Link
              to="/resources?term=odd"
              className={`px-3 py-1.5 rounded-full border ${term === 'odd' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Odd Sem
            </Link>
            <Link
              to="/resources?term=even"
              className={`px-3 py-1.5 rounded-full border ${term === 'even' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Even Sem
            </Link>
            {term && (
              <Link
                to="/resources"
                className="px-3 py-1.5 rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Clear
              </Link>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${category.color} flex items-center justify-center mb-3 sm:mb-4`}>
                {category.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
            </div>
          ))}
        </div>

        {/* Resources Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Resources by Subject</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {groupedResources.length} subject{groupedResources.length !== 1 ? 's' : ''} • {filtered.length} total resource{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const allExpanded = new Set(groupedResources.map(g => g.subjectCode));
                  setExpandedFolders(allExpanded);
                }}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-center"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedFolders(new Set())}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-center"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Resources by Subject Code Folders */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : groupedResources.length === 0 ? (
            <div className="text-sm text-gray-500">No resources found.</div>
          ) : groupedResources.map((group) => (
            <div key={group.subjectCode} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Folder Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => toggleFolder(group.subjectCode)}
              >
                <div className="flex items-center space-x-3">
                  {expandedFolders.has(group.subjectCode) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <Folder className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {group.subjectCode === 'NO_CODE' ? 'Uncategorized Resources' : group.subjectCode}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.resources.length} resource{group.resources.length !== 1 ? 's' : ''}
                      {group.resources.length > 0 && group.subjectCode !== 'NO_CODE' && (
                        <span className="ml-2">• {group.resources[0].subject}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {group.resources.length} files
                </div>
              </div>

              {/* Folder Content */}
              {expandedFolders.has(group.subjectCode) && (
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.resources.map((resource) => (
                          <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={resource.fileName}>
                                    {resource.fileName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {resource.fileType?.split('/')[1]?.toUpperCase() || 'File'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{resource.subject}</div>
                              {resource.subjectCode && (
                                <div className="text-xs text-gray-500 font-mono">{resource.subjectCode}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Sem {resource.semester}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{resource.teacherName || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{resource.academicYear}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                resource.term === 'odd' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {resource.term?.charAt(0).toUpperCase() + resource.term?.slice(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(() => {
                                  const t: any = resource.uploadedAt;
                                  const ms = t?.seconds !== undefined
                                    ? t.seconds * 1000
                                    : (t instanceof Date ? t.getTime() : 0);
                                  return ms ? new Date(ms).toLocaleDateString() : 'N/A';
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  const t: any = resource.uploadedAt;
                                  const ms = t?.seconds !== undefined
                                    ? t.seconds * 1000
                                    : (t instanceof Date ? t.getTime() : 0);
                                  return ms ? new Date(ms).toLocaleTimeString() : '';
                                })()}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                {(() => {
                                  const isPdf = (resource.fileType || '').toLowerCase().includes('pdf') || (resource.fileName || '').toLowerCase().endsWith('.pdf');
                                  const directUrl = resource.fileUrl;
                                  return (
                                    <>
                                      <a 
                                        href={directUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                        title="Download/Open"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </a>
                                      {isPdf && (
                                        <a
                                          href={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(directUrl)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-green-600 hover:text-green-900 transition-colors"
                                          title="View PDF"
                                        >
                                          <BookOpen className="h-4 w-4" />
                                        </a>
                                      )}
                                    </>
                                  );
                                })()}
                                {canDelete(resource) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(resource)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Delete Resource"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Load More Resources
          </button>
        </div>
      </div>
    </div>
  );
};

export default Resources;
