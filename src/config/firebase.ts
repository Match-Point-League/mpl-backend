import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes Firebase Admin SDK for server-side operations.
 * It handles user creation, authentication, and other Firebase services
 * that require elevated privileges.
 */

// Validate required Firebase environment variables
const validateFirebaseConfig = (): void => {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Warning: Missing Firebase environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('📝 Firebase Admin SDK will not be initialized. User registration will fail.');
  }
};

// Create service account configuration
const createServiceAccount = (): ServiceAccount | null => {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL
  } = process.env;

  // Check if we have the minimum required credentials
  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    return null;
  }

  return {
    projectId: FIREBASE_PROJECT_ID,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: FIREBASE_CLIENT_EMAIL
  };
};

// Initialize Firebase Admin SDK
let app;
let auth;

try {
  validateFirebaseConfig();
  
  const serviceAccount = createServiceAccount();
  
  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    auth = getAuth(app);
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠️  Firebase Admin SDK not initialized - missing credentials');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

// Export auth instance (will be undefined if initialization failed)
export { auth };
export default app;