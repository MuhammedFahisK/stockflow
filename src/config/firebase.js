// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuusDoX1CHaZzNEMZJ9l6RtvzmJkOc4dE",
  authDomain: "stockflow-f3704.firebaseapp.com",
  projectId: "stockflow-f3704",
  storageBucket: "stockflow-f3704.firebasestorage.app",
  messagingSenderId: "356631258657",
  appId: "1:356631258657:web:c8f16b8fa662007a9de560",
  measurementId: "G-7WJG7LEPVW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;