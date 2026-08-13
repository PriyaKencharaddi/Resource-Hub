import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCT0dKwD59J17W5LST7tMLpyeuId1OGV84",
  authDomain: "resourcehub-cfc9b.firebaseapp.com",
  projectId: "resourcehub-cfc9b",
  storageBucket: "resourcehub-cfc9b.firebasestorage.app",
  messagingSenderId: "621354417382",
  appId: "1:621354417382:web:eb68627fbec6ead4390f27",
  measurementId: "G-XP0P6HPNBE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;