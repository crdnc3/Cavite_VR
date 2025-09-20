// src/firebaseAuth.js
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Register a new user with email, password, and username.
 * Saves user info to Firestore after registration.
 * @param {string} email 
 * @param {string} password 
 * @param {string} username
 * @returns {Promise} resolves with user or rejects with error
 */
export const registerUser = async (email, password, username) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      role: "User",               // Default role
      createdAt: serverTimestamp()
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Log in user with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} resolves with user or rejects with error
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};
