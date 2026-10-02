import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence,
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Employee, LeaveRecord, OfficialSignatures, AdminUser } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_LEAVE_RECORDS } from '../data/mockData';
import { INITIAL_ADMIN_USERS } from '../data/mockAdminUsers';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore Database
export const db = firebaseConfigJson.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, offline persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable offline persistence.');
  }
});

export const auth = getAuth(app);

const EMPLOYEES_COLLECTION = 'employees';
const LEAVE_RECORDS_COLLECTION = 'leaveRecords';
const ADMIN_USERS_COLLECTION = 'adminUsers';
const SETTINGS_COLLECTION = 'settings';
const SIGNATURES_DOC_ID = 'officialSignatures';

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all `undefined` values from an object or array.
 * Firestore strictly rejects `undefined` values in documents, so all data
 * must be sanitized before being written via setDoc, updateDoc, or writeBatch.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Initialize Firestore data if empty, migrating any existing local or initial records
 */
export async function initializeFirestoreDatabase(
  localEmployees?: Employee[], 
  localLeaveRecords?: LeaveRecord[],
  localAdminUsers?: AdminUser[]
) {
  try {
    const empSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    if (empSnap.empty) {
      console.log('Seeding initial employees to Firestore...');
      const seedEmps = (localEmployees && localEmployees.length > 0) ? localEmployees : INITIAL_EMPLOYEES;
      const batch = writeBatch(db);
      seedEmps.forEach(emp => {
        const empRef = doc(db, EMPLOYEES_COLLECTION, emp.id);
        batch.set(empRef, sanitizeForFirestore(emp));
      });
      await batch.commit();
      console.log('Seeded employees successfully');
    }

    const leaveSnap = await getDocs(collection(db, LEAVE_RECORDS_COLLECTION));
    if (leaveSnap.empty) {
      console.log('Seeding initial leave records to Firestore...');
      const seedLeaves = (localLeaveRecords && localLeaveRecords.length > 0) ? localLeaveRecords : INITIAL_LEAVE_RECORDS;
      const batch = writeBatch(db);
      seedLeaves.forEach(record => {
        const recordRef = doc(db, LEAVE_RECORDS_COLLECTION, record.id);
        batch.set(recordRef, sanitizeForFirestore(record));
      });
      await batch.commit();
      console.log('Seeded leave records successfully');
    }

    const adminSnap = await getDocs(collection(db, ADMIN_USERS_COLLECTION));
    if (adminSnap.empty) {
      console.log('Seeding initial admin users to Firestore...');
      const seedAdmins = (localAdminUsers && localAdminUsers.length > 0) ? localAdminUsers : INITIAL_ADMIN_USERS;
      const batch = writeBatch(db);
      seedAdmins.forEach(admin => {
        const adminRef = doc(db, ADMIN_USERS_COLLECTION, admin.id);
        batch.set(adminRef, sanitizeForFirestore(admin));
      });
      await batch.commit();
      console.log('Seeded admin users successfully');
    }
  } catch (error) {
    console.error('Error initializing Firestore data:', error);
  }
}

/**
 * Real-time subscription to Employees collection
 */
export function subscribeToEmployees(onData: (employees: Employee[]) => void) {
  const colRef = collection(db, EMPLOYEES_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: Employee[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Employee);
    });
    if (list.length > 0) {
      onData(list);
    }
  }, (error) => {
    console.error('Error subscribing to employees:', error);
  });
}

/**
 * Real-time subscription to Leave Records collection
 */
export function subscribeToLeaveRecords(onData: (records: LeaveRecord[]) => void) {
  const colRef = collection(db, LEAVE_RECORDS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: LeaveRecord[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as LeaveRecord);
    });
    // Sort by createdAt descending or startDate descending
    list.sort((a, b) => (b.createdAt || b.startDate).localeCompare(a.createdAt || a.startDate));
    if (list.length > 0) {
      onData(list);
    }
  }, (error) => {
    console.error('Error subscribing to leave records:', error);
  });
}

/**
 * Save/Update Employee in Firestore with automatic sanitization
 */
export async function saveEmployeeToFirestore(employee: Employee) {
  const path = `${EMPLOYEES_COLLECTION}/${employee.id}`;
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    const sanitizedData = sanitizeForFirestore(employee);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Employee in Firestore
 */
export async function deleteEmployeeFromFirestore(id: string) {
  const path = `${EMPLOYEES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete Multiple Employees in Firestore
 */
export async function deleteMultipleEmployeesFromFirestore(ids: string[]) {
  const path = EMPLOYEES_COLLECTION;
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, EMPLOYEES_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save/Update Leave Record in Firestore with automatic sanitization
 */
export async function saveLeaveRecordToFirestore(record: LeaveRecord) {
  const path = `${LEAVE_RECORDS_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, LEAVE_RECORDS_COLLECTION, record.id);
    const sanitizedData = sanitizeForFirestore(record);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Leave Record in Firestore
 */
export async function deleteLeaveRecordFromFirestore(id: string) {
  const path = `${LEAVE_RECORDS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, LEAVE_RECORDS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete Multiple Leave Records in Firestore
 */
export async function deleteMultipleLeaveRecordsFromFirestore(ids: string[]) {
  const path = LEAVE_RECORDS_COLLECTION;
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, LEAVE_RECORDS_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save Official Signatures to Firestore
 */
export async function saveOfficialSignaturesToFirestore(signatures: OfficialSignatures) {
  const path = `${SETTINGS_COLLECTION}/${SIGNATURES_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SIGNATURES_DOC_ID);
    const sanitizedData = sanitizeForFirestore(signatures);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to Official Signatures in Firestore
 */
export function subscribeToOfficialSignatures(onData: (signatures: OfficialSignatures) => void) {
  const docRef = doc(db, SETTINGS_COLLECTION, SIGNATURES_DOC_ID);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.data() as OfficialSignatures);
    }
  }, (error) => {
    console.error('Error subscribing to official signatures:', error);
  });
}

/**
 * Real-time subscription to Admin Users collection
 */
export function subscribeToAdminUsers(onData: (users: AdminUser[]) => void) {
  const colRef = collection(db, ADMIN_USERS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: AdminUser[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AdminUser);
    });
    if (list.length > 0) {
      onData(list);
    }
  }, (error) => {
    console.error('Error subscribing to admin users:', error);
  });
}

/**
 * Save/Update Admin User in Firestore
 */
export async function saveAdminUserToFirestore(user: AdminUser) {
  const path = `${ADMIN_USERS_COLLECTION}/${user.id}`;
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, user.id);
    const sanitizedData = sanitizeForFirestore(user);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Admin User in Firestore
 */
export async function deleteAdminUserFromFirestore(id: string) {
  const path = `${ADMIN_USERS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete Multiple Admin Users in Firestore
 */
export async function deleteMultipleAdminUsersFromFirestore(ids: string[]) {
  const path = ADMIN_USERS_COLLECTION;
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, ADMIN_USERS_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

