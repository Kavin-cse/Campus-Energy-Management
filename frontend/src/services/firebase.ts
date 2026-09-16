import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, off, push, set, update, get } from "firebase/database";

const mockMode = import.meta.env.VITE_FIREBASE_MOCK_MODE !== 'false';

// Default mock configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mock-db.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase
let app;
let database: any;

if (!mockMode) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized");
  } catch (error) {
    console.error("Firebase init failed, falling back to mock", error);
    database = null;
  }
}

// In-memory mock DB for frontend if backend also mocking, but we actually want 
// frontend to poll or use mock backend if firebase isn't real.
// To keep it simple, we'll implement a Mock database ref here.
class MockRef {
  path: string;
  constructor(path: string) {
    this.path = path;
  }
}

// Simulated simple event bus for mock mode
const mockDataStore: any = {
  "campusEnergy/devices": {},
  "campusEnergy/occupancy": {},
  "campusEnergy/readings": {}
};
const mockListeners: Record<string, ((val: any) => void)[]> = {};

function notifyMockListeners(path: string) {
  if (mockListeners[path]) {
    mockListeners[path].forEach(cb => {
      // Return a mock snapshot
      cb({
        val: () => {
          const parts = path.split('/').filter(Boolean);
          let curr = mockDataStore;
          for (const p of parts) {
            if (!curr) return null;
            curr = curr[p];
          }
          return curr;
        },
        exists: () => true
      });
    });
  }
}

export const getDbRef = (path: string) => {
  if (!mockMode && database) {
    return ref(database, path);
  }
  return new MockRef(path);
};

export const subscribeToNode = (path: string, callback: (data: any) => void) => {
  if (!mockMode && database) {
    const dbRef = ref(database, path);
    onValue(dbRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(dbRef);
  } else {
    // Mock subscription
    if (!mockListeners[path]) {
      mockListeners[path] = [];
    }
    const wrapper = (snapshot: any) => {
      callback(snapshot.val());
    };
    mockListeners[path].push(wrapper);
    // Initial call
    notifyMockListeners(path);
    return () => {
      mockListeners[path] = mockListeners[path].filter(cb => cb !== wrapper);
    };
  }
};

export const mockUpdateStore = (path: string, data: any) => {
  const parts = path.split('/').filter(Boolean);
  let curr = mockDataStore;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  const last = parts[parts.length - 1];
  curr[last] = data;
  notifyMockListeners(path);
};
