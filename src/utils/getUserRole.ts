import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getUserRole(uid: string): Promise<string | null> {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return (data?.role as string) ?? null;
}


