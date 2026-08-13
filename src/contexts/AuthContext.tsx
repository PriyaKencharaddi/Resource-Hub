import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, AuthContextType, SignupData } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signup = async (userData: SignupData) => {
    const { email, password, username, role, usn, semester, subjects } = userData;
    const ADMIN_EMAIL = 'sksvmacet@gmail.com';
    if (role === 'admin' && email !== ADMIN_EMAIL) {
      throw new Error('Only the designated admin email can sign up as admin.');
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfileData: Partial<User> = {
      uid: user.uid,
      email,
      username,
      role,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // Add role-specific data
    if (role === 'student') {
      if (usn) (userProfileData as any).usn = usn;
      if (semester) (userProfileData as any).semester = semester;
    } else if (role === 'teacher' && subjects) {
      (userProfileData as any).subjects = subjects;
    } else if (role === 'admin') {
      // Additional hardening: enforce admin email matches exactly on profile creation
      (userProfileData as any).email = ADMIN_EMAIL;
      (userProfileData as any).permissions = ['manage_users', 'manage_resources', 'manage_system'];
    }

    await setDoc(doc(db, 'users', user.uid), userProfileData);
    
    // Navigate to appropriate dashboard after signup
    setTimeout(() => {
      switch (role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'teacher':
          navigate('/teacher-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }, 100);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    
    // Navigation will be handled in the useEffect when userProfile is loaded
  };

  const logout = async () => {
    await signOut(auth);
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        } as User);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle navigation after user profile is loaded
  useEffect(() => {
    if (currentUser && userProfile && !loading) {
      const currentPath = window.location.pathname;
      
      // Only redirect if user is on login/signup pages or generic dashboard
      if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/dashboard') {
        switch (userProfile.role) {
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'teacher':
            navigate('/teacher-dashboard');
            break;
          case 'admin':
            navigate('/admin-dashboard');
            break;
        }
      }
    }
  }, [currentUser, userProfile, loading, navigate]);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};