import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Upload, BookOpen, Award } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary } from '../utils/cloudinary';

const TeacherDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const teacherUser = userProfile as any;

  // Upload form state
  const [semester, setSemester] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState<'odd' | 'even' | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/gif',
  ];

  const resetForm = () => {
    setSemester('');
    setSubject('');
    setSubjectCode('');
    setAcademicYear('');
    setTerm('');
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!userProfile || userProfile.role !== 'teacher') return;
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

      await addDoc(collection(db, 'resources'), {
        teacherId: userProfile.uid,
        teacherName: userProfile.username,
        semester: Number(semester),
        subject,
        subjectCode: subjectCode.trim(),
        academicYear,
        term,
        fileUrl: result.url,
        deleteToken: result.deleteToken || null,
        fileName: file.name,
        fileType: file.type,
        downloads: 0,
        uploadedAt: serverTimestamp(),
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl text-white p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome, Prof. {userProfile.username}! 👨‍🏫
              </h1>
              <p className="text-sm sm:text-lg opacity-90 mb-3 sm:mb-4">
                Inspiring minds and sharing knowledge
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-80">
                <span>Department: {teacherUser.department || 'Computer Science'}</span>
                <span>•</span>
                <span>Subjects: {teacherUser.subjects?.length || 0}</span>
              </div>
            </div>
            <div className="bg-white/20 p-3 sm:p-4 rounded-full backdrop-blur-sm hidden sm:block">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Upload Campus Resources */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8 mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
            Upload Campus Resources
          </h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                  value={semester}
                  onChange={(e) =>
                    setSemester(e.target.value ? Number(e.target.value) : '')
                  }
                  required
                >
                  <option value="">Select Semester</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                {teacherUser.subjects && teacherUser.subjects.length > 0 ? (
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {teacherUser.subjects.map((s: string, idx: number) => (
                      <option key={idx} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Data Structures"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., CS301, CS-ML101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2024-25"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odd/Even Semester
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
                  value={term}
                  onChange={(e) =>
                    setTerm(e.target.value as 'odd' | 'even' | '')
                  }
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
                File Upload
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="teacher-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="teacher-file-upload"
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
            </div>

            {submitMessage && (
              <div
                className={`p-4 rounded-md ${
                  submitMessage.includes('success')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {submitMessage}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
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

        {/* Bottom Section: Your Subjects + Achievement Badge side by side */}
        {teacherUser.subjects && teacherUser.subjects.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Your Subjects */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Your Subjects
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teacherUser.subjects.map((subject: string, index: number) => (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-green-900">{subject}</h4>
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white shadow-md flex flex-col justify-center">
              <div className="flex items-center mb-3">
                <Award className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="font-bold text-lg">Top Contributor</h3>
                  <p className="text-sm opacity-90">This semester</p>
                </div>
              </div>
              <p className="text-sm opacity-90">
                You're in the top 5% of teachers for resource sharing!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
