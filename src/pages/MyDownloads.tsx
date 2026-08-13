import React from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

type DownloadEntry = {
  id: string;
  resourceId: string;
  fileName: string;
  subject?: string;
  semester?: number;
  fileUrl?: string;
  fileType?: string;
  downloadedAt?: { seconds: number; nanoseconds: number } | Date | null;
};

const MyDownloads: React.FC = () => {
  const { userProfile } = useAuth();

  const [items, setItems] = React.useState<DownloadEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(
      collection(db, 'users', userProfile.uid, 'downloads'),
      orderBy('downloadedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: DownloadEntry[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, [userProfile?.uid]);

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Downloads</h1>
          <p className="text-gray-600 text-xs sm:text-sm">All files you have downloaded will appear here in real time.</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {loading ? (
            <div className="text-sm text-gray-500">Loading downloads...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">No downloads yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Title</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Subject</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Sem</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">When</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[300px]">{d.fileName}</td>
                      <td className="px-4 py-2">{d.subject || '-'}</td>
                      <td className="px-4 py-2">{d.semester ?? '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {d.downloadedAt && (d as any).downloadedAt?.seconds !== undefined
                          ? new Date((d as any).downloadedAt.seconds * 1000).toLocaleString()
                          : (d.downloadedAt instanceof Date ? d.downloadedAt.toLocaleString() : '-')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {d.fileUrl ? (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                          >
                            Open
                          </a>
                        ) : (
                          <Link to={`/resources?focus=${encodeURIComponent(d.resourceId)}`} className="text-blue-600 hover:underline">
                            View Resource
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDownloads;


