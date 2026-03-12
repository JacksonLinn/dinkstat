import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Auth ───────────────────────────────────────────────

export async function registerUser(email, password, firstName, lastName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const playerData = {
    firstName,
    lastName,
    email,
    lp: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "players", cred.user.uid), playerData);
  return { id: cred.user.uid, ...playerData };
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getDoc(doc(db, "players", cred.user.uid));
  if (!profile.exists()) throw new Error("Player profile not found");
  return { id: cred.user.uid, ...profile.data() };
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getDoc(doc(db, "players", firebaseUser.uid));
      if (profile.exists()) {
        callback({ id: firebaseUser.uid, ...profile.data() });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// ── Players ────────────────────────────────────────────

export function subscribeToPlayers(callback) {
  return onSnapshot(collection(db, "players"), (snap) => {
    const players = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(players);
  });
}

export async function updatePlayerLp(playerId, newLp) {
  await updateDoc(doc(db, "players", playerId), { lp: newLp });
}

// ── Matches ────────────────────────────────────────────

export function subscribeToMatches(callback) {
  const q = query(collection(db, "matches"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(matches);
  });
}

export async function addMatch(matchData) {
  const ref = await addDoc(collection(db, "matches"), {
    ...matchData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteMatchDoc(matchId) {
  await deleteDoc(doc(db, "matches", matchId));
}

export { auth, db };