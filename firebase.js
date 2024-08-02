// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwndUna4M2lsfic4BU5csLAR1TluNcmuU",
  authDomain: "inventory-tracker-3d3c7.firebaseapp.com",
  projectId: "inventory-tracker-3d3c7",
  storageBucket: "inventory-tracker-3d3c7.appspot.com",
  messagingSenderId: "381407234707",
  appId: "1:381407234707:web:4e502d2824551646b7db66",
  measurementId: "G-FXF1DL6S61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore (app);
const storage = getStorage(app);

export { firestore, storage };