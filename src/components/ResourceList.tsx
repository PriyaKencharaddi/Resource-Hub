import React from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { Download, Trash2 } from 'lucide-react';
import { db, auth } from '../config/firebase';
import { deleteFromCloudinaryByToken } from '../utils/cloudinary';
import { getUserRole } from '../utils/getUserRole';

type Role = 'admin' | 'teacher' | 'student';
type Term = 'odd' | 'even';

type Resource = {
  id: string;
  fileName: string;
  url: string;
  uploadedBy: string;
  role: Role;
  timestamp?: { seconds: number; nanoseconds: number } | Date;
  deleteToken?: string | null;
  semester?: number;
  subject?: string;
  academicYear?: string;
  term?: Term;
  fileType?: string;
};

type Props = {
  className?: string;
  showFilters?: boolean;
  allowDelete?: boolean;
};

const ResourceList: React.FC<Props> = ({ className, showFilters = true, allowDelete = true }) => {
  const [items, setItems] = React.useState<Resource[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role | null>(null);

  const [filterSemester, setFilterSemester] = React.useState<number | ''>('');
  const [filterSubject, setFilterSubject] = React.useState('');
  const [filterYear, setFilterYear] = React.useState('');
  const [filterTerm, setFilterTerm] = React.useState<Term | ''>('');
  const [filterQuery, setFilterQuery] = React.useState('');

  const user = auth.currentUser;

  React.useEffect(() => {
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
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const canDelete = React.useCallback(
    (r: Resource) => {
      if (!allowDelete) return false;
      if (!role) return false;
      if (role === 'admin') return true;
      if (role === 'teacher') return r.uploadedBy === user?.uid;
      return false;
    },
    [allowDelete, role, user?.uid]
  );

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'resources'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list: Resource[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setItems(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = React.useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return items.filter((r) => {
      const matchesSem = filterSemester ? r.semester === Number(filterSemester) : true;
      const matchesSubj = filterSubject ? (r.subject || '').toLowerCase().includes(filterSubject.toLowerCase()) : true;
      const matchesYear = filterYear ? (r.academicYear || '').toLowerCase().includes(filterYear.toLowerCase()) : true;
      const matchesTerm = filterTerm ? r.term === filterTerm : true;
      const matchesQuery = q ? (r.fileName || '').toLowerCase().includes(q) : true;
      return matchesSem && matchesSubj && matchesYear && matchesTerm && matchesQuery;
    });
  }, [items, filterSemester, filterSubject, filterYear, filterTerm, filterQuery]);

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

  const uniqueSubjects = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  return (
    <div className={className}>
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Search by file name"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Semesters</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                <option key={sem} value={sem}>Sem {sem}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Academic Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value as Term | '')}
            >
              <option value="">Odd/Even</option>
              <option value="odd">Odd</option>
              <option value="even">Even</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Title</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Subject</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Sem</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Year</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Term</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Uploaded</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>No resources found.</td>
              </tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[260px]">{r.fileName}</td>
                <td className="px-4 py-2">{r.subject || '-'}</td>
                <td className="px-4 py-2">{r.semester ?? '-'}</td>
                <td className="px-4 py-2">{r.academicYear || '-'}</td>
                <td className="px-4 py-2 capitalize">{r.term || '-'}</td>
                <td className="px-4 py-2">{r.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</td>
                <td className="px-4 py-2 text-xs text-gray-600">
                  {r.timestamp && (r as any).timestamp?.seconds
                    ? new Date((r as any).timestamp.seconds * 1000).toLocaleString()
                    : (r.timestamp instanceof Date ? r.timestamp.toLocaleString() : '-')}
                </td>
                <td className="px-4 py-2">
  <div className="flex flex-col md:flex-row flex-wrap gap-2 justify-end items-center">
    {/* Open button */}
    <a
      href={(r as any).url || (r as any).fileUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-600 transition-all duration-200"
    >
      <Download className="w-4 h-4" />
      Open
    </a>

    {/* View PDF.js button */}
    {((r.fileType || '').toLowerCase().includes('pdf') || (r.fileName || '').toLowerCase().endsWith('.pdf')) && (
      <a
        href={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent((r as any).url || (r as any).fileUrl)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 bg-white text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-100 transition-all duration-200"
      >
        View PDF
      </a>
    )}

    {/* Copy URL */}
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText((r as any).url || (r as any).fileUrl || '')}
      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 bg-white text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-100 transition-all duration-200"
    >
      Copy URL
    </button>

    {/* Delete button (if allowed) */}
    {canDelete(r) && (
      <button
        onClick={() => handleDelete(r)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-red-600 transition-all duration-200"
      >
        <Trash2 className="w-4 h-4" />
        Delete
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
  );
};

export default ResourceList;


