import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, ArrowLeft, FileText, BookOpen, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary } from '../utils/cloudinary';

const AdminUpload: React.FC = () => {
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

  // Enforce that only the single allowed admin email can access this page
  if (userProfile.role !== 'admin' || userProfile.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <Upload className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Unauthorized</h2>
          <p className="text-gray-600 text-sm">You do not have permission to access this page.</p>
          <Link to="/admin" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Upload form state
  const [semester, setSemester] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState<'odd' | 'even' | ''>('');
  const [subjectCode, setSubjectCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/gif'
  ];

  const resetForm = () => {
    setSemester('');
    setSubject('');
    setAcademicYear('');
    setTerm('');
    setFile(null);
    setSubjectCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!userProfile || userProfile.role !== 'admin') return;
    if (!semester || !subject || !subjectCode.trim() || !academicYear || !term) {
      setSubmitMessage('Please fill in all fields.');
      return;
    }
    if (!file) {
      setSubmitMessage('Please select a file to upload.');
      return;
    }
    if (!allowedMimeTypes.includes(file.type)) {
      setSubmitMessage('Unsupported file type. Please upload PDF, PPT, DOC, or an image.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await uploadToCloudinary(file);
      // eslint-disable-next-line no-console
      console.log('[AdminUpload] Uploaded file result:', result);
      setUploadedUrl(result.url || null);

      // Save metadata in Firestore (standardized with ResourceList expectations)
      await addDoc(collection(db, 'resources'), {
        uploadedBy: userProfile.uid,
        role: 'admin',
        fileName: file.name,
        url: result.url,
        deleteToken: result.deleteToken || null,
        fileType: file.type,
        semester: Number(semester),
        subject,
        subjectCode: subjectCode.trim(),
        academicYear,
        term,
        timestamp: serverTimestamp(),
      });

      setSubmitMessage('Resource uploaded successfully.');
      resetForm();
    } catch (err) {
      console.error(err);
      setSubmitMessage('Failed to upload resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/admin" 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Admin Resource Upload 🛡️</h1>
                <p className="text-lg opacity-90 mb-4">Upload campus resources as an administrator</p>
                <div className="flex items-center space-x-4 text-sm opacity-80">
                  <span>Admin: {userProfile.username}</span>
                  <span>•</span>
                  <span>Role: System Administrator</span>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Upload className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Upload className="h-6 w-6 text-purple-600 mr-3" />
            Upload Campus Resource
          </h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Semester
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select Semester</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Subject Code
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., CS301, CS-ML101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Data Structures, Machine Learning"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Academic Year
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 2025-26"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4 inline mr-1" />
                  Odd/Even Semester
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={term}
                  onChange={(e) => setTerm(e.target.value as 'odd' | 'even' | '')}
                  required
                >
                  <option value="">Select Term</option>
                  <option value="odd">Odd Semester</option>
                  <option value="even">Even Semester</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="h-4 w-4 inline mr-1" />
                File Upload
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, PPT, DOC, or images up to 10MB
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Selected file:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            {submitMessage && (
              <div className={`p-4 rounded-md ${
                submitMessage.includes('success') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {submitMessage}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {uploadedUrl && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-2">Uploaded URL (test in new tab):</p>
            <div className="flex items-center gap-2">
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-green-700 underline break-all"
              >
                {uploadedUrl}
              </a>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(uploadedUrl); }}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Upload Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Ensure all files are relevant to the specified semester and subject</li>
            <li>• Use clear, descriptive filenames</li>
            <li>• Verify that the academic year and term are correct</li>
            <li>• Only upload educational materials (lectures, notes, assignments, etc.)</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Supported formats: PDF, PowerPoint, Word documents, and images</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
