// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDD6coY49gQGo7rkhcPQY6nUhftziODTPY",
  authDomain: "escape-portal-au.firebaseapp.com",
  projectId: "escape-portal-au",
  storageBucket: "escape-portal-au.firebasestorage.app",
  messagingSenderId: "917308365081",
  appId: "1:917308365081:web:b965a45f02ba882c678d88",
  measurementId: "G-YPEZP4Y2G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
