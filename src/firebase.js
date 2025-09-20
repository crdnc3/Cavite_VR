import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const env = import.meta.env;

// ✅ Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: env.VITE_GOOGLEAPIKEY,
  authDomain: "login-auth-fcc61.firebaseapp.com",
  projectId: "login-auth-fcc61",
  storageBucket: "login-auth-fcc61.appspot.com", // ✅ FIXED: added .com
  messagingSenderId: env.VITE_MESSID,
  appId: env.VITE_APPID,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export auth and Firestore DB
export const auth = getAuth(app);
export const db = getFirestore(app);
