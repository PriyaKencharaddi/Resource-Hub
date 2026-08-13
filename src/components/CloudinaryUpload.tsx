import React, { useCallback, useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Upload } from 'lucide-react';
import { db, auth } from '../config/firebase';
import { uploadToCloudinary } from '../utils/cloudinary';
import { getUserRole } from '../utils/getUserRole';

type Term = 'odd' | 'even';
type Role = 'admin' | 'teacher' | 'student';

type Props = {
  className?: string;
};

const CloudinaryUpload: React.FC<Props> = ({ className }) => {
  const [semester, setSemester] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState<Term | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const user = auth.currentUser;
  const canUpload = useMemo(() => role === 'admin' || role === 'teacher', [role]);

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

  const resetForm = useCallback(() => {
    setSemester('');
    setSubject('');
    setSubjectCode('');
    setAcademicYear('');
    setTerm('');
    setFile(null);
    setProgress(0);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user?.uid) {
      setMessage('You must be logged in.');
      return;
    }
    if (!canUpload) {
      setMessage('You do not have permission to upload.');
      return;
    }
    if (!semester || !subject || !subjectCode.trim() || !academicYear || !term) {
      setMessage('Please fill in all fields.');
      return;
    }
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      const uploadResult = await uploadToCloudinary(file, (p) => setProgress(p));

      const resourceDoc = {
        fileName: file.name,
        url: uploadResult.url,
        uploadedBy: user.uid,
        role: role as Role,
        timestamp: serverTimestamp() as any,
        deleteToken: uploadResult.deleteToken || null,
        semester: Number(semester),
        subject,
        subjectCode: subjectCode.trim(),
        academicYear,
        term,
        fileType: file.type,
      };

      await addDoc(collection(db, 'resources'), resourceDoc);
      setMessage('Upload successful.');
      resetForm();
    } catch (err) {
      console.error(err);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [user?.uid, canUpload, semester, subject, academicYear, term, file, role, resetForm]);

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Upload className="h-5 w-5 text-blue-600 mr-2" />
            Upload Resource
          </h2>
          <div className={`text-xs px-2 py-1 rounded ${canUpload ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {role ? `Role: ${role}` : 'Role: -'}
          </div>
        </div>

        {!canUpload && (
          <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
            Only admins and teachers can upload resources.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Semester</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={semester}
                onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                disabled={!canUpload}
                required
              >
                <option value="">Select Semester</option>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Subject</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Data Structures"
                disabled={!canUpload}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Subject Code</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g., CS301, CS-ML101"
                disabled={!canUpload}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Academic Year</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-25"
                disabled={!canUpload}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Term</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={term}
                onChange={(e) => setTerm(e.target.value as Term | '')}
                disabled={!canUpload}
                required
              >
                <option value="">Select Term</option>
                <option value="odd">Odd</option>
                <option value="even">Even</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">File</label>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={!canUpload}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Allowed: PDF, PPT, DOC, Images</p>
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {message && (
            <div className={`text-sm ${message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!canUpload || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloudinaryUpload;


