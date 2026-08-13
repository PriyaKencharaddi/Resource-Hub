import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Mail, Lock, User, Eye, EyeOff, GraduationCap, Users, Shield } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [usn, setUsn] = useState('');
  const [semester, setSemester] = useState<number | ''>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const availableSubjects = [
    'Engineering Mathematics', 'Physics', 'Chemistry', 'Programming',
    'Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks',
    'Operating Systems', 'Software Engineering', 'Machine Learning',
    'Web Development', 'Artificial Intelligence', 'Cybersecurity'
  ];

  const addSubject = () => {
    const trimmedSubject = newSubject.trim();
    if (trimmedSubject && !subjects.includes(trimmedSubject)) {
      setSubjects([...subjects, trimmedSubject]);
      setNewSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
  
    // Username: letters and spaces only
if (!/^[A-Za-z ]+$/.test(username)) {
  return setError('Username can only contain letters and spaces.');
}

    
    // Email: must end with @gmail.com (case-insensitive)
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      return setError('Email must be a valid Gmail address ending with @gmail.com.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    // USN (students only): exactly 2KA + 2 digits + CS + 3 digits (e.g., 2KA23CS041)
    if (role === 'student') {
      const normalizedUsn = (usn || '').toUpperCase();
      if (!/^2KA\d{2}CS\d{3}$/.test(normalizedUsn)) {
        return setError('USN must be exactly 2KA + 2 digits + CS + 3 digits (e.g., 2KA23CS041).');
      }
    }
    
    try {
      setError('');
      setLoading(true);
      
      const userData = {
        email,
        password,
        username,
        role,
        ...(role === 'student' && { usn }),
        ...(role === 'student' && semester && { semester: Number(semester) }),
        ...(role === 'teacher' && { subjects }),
      };
      
      await signup(userData);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-blue-100 p-2.5 sm:p-3 rounded-full">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Join CSE Resources</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Create your account to start sharing and accessing resources</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2.5 sm:p-4 border-2 rounded-lg text-center transition-all ${
                    role === 'student'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
                  <div className="font-medium text-xs sm:text-sm">Student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-2.5 sm:p-4 border-2 rounded-lg text-center transition-all ${
                    role === 'teacher'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Teacher</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    role === 'admin'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Shield className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Admin</div>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {role === 'student' && (
              <>
                <div>
                  <label htmlFor="usn" className="block text-sm font-medium text-gray-700 mb-2">
                    University Seat Number (USN)
                  </label>
                  <input
                    id="usn"
                    type="text"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1MS21CS001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Semester</option>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects You Teach
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubject();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type subject name or select from dropdown"
                      list="subjects-list"
                    />
                    <datalist id="subjects-list">
                      {availableSubjects
                        .filter(subject => !subjects.includes(subject))
                        .map(subject => (
                          <option key={subject} value={subject} />
                        ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={addSubject}
                      disabled={!newSubject.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                   <div className="text-xs text-gray-500">
                     💡 Tip: Start typing to see suggestions, or enter any custom subject
                   </div>
                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(subject => (
                        <span
                          key={subject}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin notice */}
            {role === 'admin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Admin accounts require approval. You'll receive an email once your account is verified.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;