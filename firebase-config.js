// Import Firebase SDK และ Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA2ZiY5Gv-72PqgFlFXYbaTav9BF-LeQ8",
  authDomain: "my-restaurant-pos-62a74.firebaseapp.com",
  projectId: "my-restaurant-pos-62a74",
  storageBucket: "my-restaurant-pos-62a74.firebasestorage.app",
  messagingSenderId: "610934330593",
  appId: "1:610934330593:web:29db39b405100c0ec253a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export ฐานข้อมูลเพื่อนำไปใช้ในไฟล์อื่น (script.js และ admin.js)
export const db = getFirestore(app);