// lib/firebase.js
import admin from 'firebase-admin';
try {

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),

      databaseURL: process.env.FIREBASE_DATABASE_URL 
    });

  }
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);

  throw new Error("Could not initialize Firebase Admin SDK. Check your credentials and database URL.");
}

export const db = admin.database();