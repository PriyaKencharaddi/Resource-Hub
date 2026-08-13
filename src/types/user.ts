import type { User as FirebaseUser } from 'firebase/auth';
export interface BaseUser {
  uid: string;
  email: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  usn: string;
  semester?: number;
  branch?: string;
}

export interface TeacherUser extends BaseUser {
  role: 'teacher';
  subjects: string[];
  department?: string;
  experience?: number;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  permissions: string[];
}

export type User = StudentUser | TeacherUser | AdminUser;

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  usn?: string;
  semester?: number;
  subjects?: string[];
}