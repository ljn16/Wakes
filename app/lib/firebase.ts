// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
//   apiKey: 'AIzaSyCN3iFF_sLmXAE03AxxflKHUG153SAG6DE',
//   authDomain: 'wakes-6085b.firebaseapp.com',
//   projectId: 'wakes-6085b',
//   storageBucket: 'wakes-6085b.appspot.com',
//   messagingSenderId: '26486742283',
//   appId: '1:26486742283:ios:67b0729133fc0de553160e',
  apiKey: "AIzaSyBsPrxomQokJ0js58KQaEoIgVXnikHp6AU",
  authDomain: "wakes-6085b.firebaseapp.com",
  projectId: "wakes-6085b",
  storageBucket: "wakes-6085b.firebasestorage.app",
  messagingSenderId: "26486742283",
  appId: "1:26486742283:web:639bc4acd032674153160e",
  measurementId: "G-JGTR0L7Q1J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBsPrxomQokJ0js58KQaEoIgVXnikHp6AU",
//   authDomain: "wakes-6085b.firebaseapp.com",
//   projectId: "wakes-6085b",
//   storageBucket: "wakes-6085b.firebasestorage.app",
//   messagingSenderId: "26486742283",
//   appId: "1:26486742283:web:639bc4acd032674153160e",
//   measurementId: "G-JGTR0L7Q1J"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);