// Import the functions you need from the SDKs you need
import { getApp,getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB1_JzeKLCn9Z0g6LnRCQ5z3Em910wfIQ",
  authDomain: "note-forge-1505c.firebaseapp.com",
  projectId: "note-forge-1505c",
  storageBucket: "note-forge-1505c.firebasestorage.app",
  messagingSenderId: "839415845666",
  appId: "1:839415845666:web:b4f086050d946025564b7b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };