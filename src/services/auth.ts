import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export async function signUp(email: string, password: string, displayName?: string) {
  // Restrict sign-ups to the autuni.ac.nz domain
  const allowedDomain = 'autuni.ac.nz'
  const emailDomain = String(email).split('@').pop()?.toLowerCase()
  if (emailDomain !== allowedDomain) {
    throw new Error('Sign up is restricted to autuni.ac.nz accounts')
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  // Create a minimal profile in Firestore
  await setDoc(doc(db, "users", uid), {
    email,
    displayName: displayName || null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // Try to fetch the user's profile from Firestore but don't block the sign-in
  // flow indefinitely. If fetching the profile fails or times out, return the
  // authenticated user immediately so callers can proceed (e.g., navigate).
  const uid = cred.user.uid;

  const withTimeout = <T,>(p: Promise<T>, ms = 3000) =>
    new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('timeout')), ms);
      p.then((v) => {
        clearTimeout(id);
        resolve(v);
      }).catch((e) => {
        clearTimeout(id);
        reject(e);
      });
    });

  let profile: any = null;
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', uid)), 3000);
    profile = snap.exists() ? snap.data() : null;
  } catch (e) {
    // ignore profile fetch errors (permission issues, network, timeout)
    profile = null;
  }

  return { user: cred.user, profile };
}

export function signOut() {
  return firebaseSignOut(auth);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
