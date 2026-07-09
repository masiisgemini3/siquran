import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query, 
  limit, 
  setDoc,
  getDoc 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { generate339Students, Student, INITIAL_TEACHERS, Teacher } from "./data";

const firebaseConfig = {
  apiKey: "AIzaSyCqjsEExe1U0DqtoW6daXKB2LNtVedqnkQ",
  authDomain: "crypto-plexus-498915-c8.firebaseapp.com",
  projectId: "crypto-plexus-498915-c8",
  storageBucket: "crypto-plexus-498915-c8.firebasestorage.app",
  messagingSenderId: "1090984979568",
  appId: "1:1090984979568:web:b24f2e91cbb895b2b998b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID
export const db = getFirestore(app, "ai-studio-3538a2cc-a5b6-4c75-96a3-1cad3ebcaca5");

// Collection paths
export const STUDENTS_COLLECTION = "students";
export const TEACHERS_COLLECTION = "teachers";
export const LOGS_COLLECTION = "logs";
export const CONFIGS_COLLECTION = "configs";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Checks if the firestore database is empty. If empty, seeds initial students and teachers to firestore.
 * This ensures the database is pre-populated with those exact 339 students and matches original app features.
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Seed initial school options configuration if not exists
    const configRef = doc(db, CONFIGS_COLLECTION, "school_options");
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      console.log("Seeding initial school options configuration...");
      await setDoc(configRef, {
        id: "school_options",
        classes: [
          '7A', '7B', '7C', '7D',
          '8A', '8B', '8C', '8D',
          '9A', '9B', '9C', '9D'
        ],
        levels: [
          '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
          'TAHSIN J.27', 'AQ', 'TG',
          'J.30', 'J.29', 'J.28', 'J.27', 'J.26', 'J.25', 'J.24', 'J.23', 'J.22', 'J.21',
          'J.20', 'J.19', 'J.18', 'J.17', 'J.16', 'J.15', 'J.14', 'J.13', 'J.12', 'J.11',
          'J.10', 'J.9', 'J.8', 'J.7', 'J.6', 'J.5', 'J.4', 'J.3', 'J.2', 'J.1'
        ],
        updatedAt: new Date().toISOString()
      });
      console.log("Successfully seeded school_options config!");
    }

    const seedStatusRef = doc(db, CONFIGS_COLLECTION, "seeding_status");
    const seedStatusSnap = await getDoc(seedStatusRef);
    
    const q = query(collection(db, STUDENTS_COLLECTION), limit(1));
    const snapshot = await getDocs(q);
    
    // If the database is completely empty (no students are registered), or the seedStatus document is missing, ALWAYS seed!
    if (snapshot.empty || !seedStatusSnap.exists()) {
      if (snapshot.empty) {
        console.log("Firestore database is empty. Starting database seeding to Cloud Firestore...");
        
        const studentsList = generate339Students();
        
        // Batch write 339 students (Firestore batches allow up to 500 operations, so 1 batch is perfect)
        const studentBatch = writeBatch(db);
        studentsList.forEach((st) => {
          const studentRef = doc(db, STUDENTS_COLLECTION, st.id);
          studentBatch.set(studentRef, {
            ...st,
            updatedAt: new Date().toISOString()
          });
        });
        await studentBatch.commit();
        console.log(`Successfully seeded ${studentsList.length} students to Firestore!`);
  
        // Seed teachers
        const teacherBatch = writeBatch(db);
        INITIAL_TEACHERS.forEach((tc) => {
          const teacherRef = doc(db, TEACHERS_COLLECTION, tc.id);
          teacherBatch.set(teacherRef, {
            ...tc,
            linkedEmail: "", // Will be linked dynamically on sign-in
            updatedAt: new Date().toISOString()
          });
        });
        await teacherBatch.commit();
        console.log(`Successfully seeded ${INITIAL_TEACHERS.length} teachers to Firestore!`);
  
        // Seed initial log
        const logRef = doc(db, LOGS_COLLECTION, "init_log");
        await setDoc(logRef, {
          id: "init_log",
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: "System Admin",
          action: "Inisialisasi",
          details: "Firestore berhasil diinisialisasi dan dieksekusi dengan 339 data peserta asli."
        });
        console.log("Successfully seeded initial log to Firestore!");
      }

      // Mark seeding as done so it will NEVER run automatically again even if empty
      await setDoc(seedStatusRef, {
        id: "seeding_status",
        hasSeeded: true,
        seededAt: new Date().toISOString()
      });
      console.log("Marked database seeding as complete!");
    } else {
      console.log("Firestore database already contains seeded data or seeding is marked complete!");
    }
  } catch (error) {
    console.error("Error seeding the database: ", error);
    handleFirestoreError(error, OperationType.GET, STUDENTS_COLLECTION);
  }
}
