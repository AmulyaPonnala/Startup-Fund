"use client";

// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvPIvpRUN4iAytm6iLInY9N6Dl6jN0J_0",
  authDomain: "startupfund-b0508.firebaseapp.com",
  projectId: "startupfund-b0508",
  storageBucket: "startupfund-b0508.firebasestorage.app",
  messagingSenderId: "546633940059",
  appId: "1:546633940059:web:0ffde52a89f264185a537e",
  measurementId: "G-E94GVT8CNM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Set persistence to LOCAL (survives browser restart)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });
}

export { app, auth };