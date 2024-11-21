import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWk2VQYHV1GOiWynrrcAaOtG5K1dVbTbs",
  authDomain: "whos-bringing-what.firebaseapp.com",
  projectId: "whos-bringing-what",
  storageBucket: "whos-bringing-what.firebasestorage.app",
  messagingSenderId: "943904493721",
  appId: "1:943904493721:web:0f84e8e2006c68926f6808",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
