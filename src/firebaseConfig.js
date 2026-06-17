
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmWTkPntFxMqb11_CJ2O5tMJPgMt_UMY8",
  authDomain: "elphidaa-6651f.firebaseapp.com",
  databaseURL: "https://elphidaa-6651f-default-rtdb.firebaseio.com",
  projectId: "elphidaa-6651f",
  storageBucket: "elphidaa-6651f.firebasestorage.app",
  messagingSenderId: "361610666174",
  appId: "1:361610666174:web:e7e07accfc09f88842feef",
  measurementId: "G-5JD796KE23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, database, auth, googleProvider };
