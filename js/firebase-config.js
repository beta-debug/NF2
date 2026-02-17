// ===== Firebase Configuration =====
// TODO: Replace with your actual Firebase project credentials
// Go to Firebase Console → Project Settings → Your apps → Web app → Config

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// ===== Admin Credentials =====
// Change these to your own admin email/password
const ADMIN_EMAIL = 'admin@shop.com';
const ADMIN_PASSWORD = 'Admin123!';

console.log('🔥 Firebase initialized');
