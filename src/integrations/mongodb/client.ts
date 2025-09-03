import * as Realm from 'realm-web';

const APP_ID = (import.meta.env.VITE_MONGODB_REALM_APP_ID as string) || '';

if (!APP_ID) {
  console.warn('VITE_MONGODB_REALM_APP_ID is not set. MongoDB Realm will not be initialized. Using demo fallback for auth.');
}

export const realmApp = APP_ID ? new Realm.App({ id: APP_ID }) : null;

// Optional direct MongoDB URI (for server-side tools). Prefer using Realm App ID for client-side auth.
export const MONGODB_URI = (import.meta.env.VITE_MONGODB_URI as string) || '';

// Demo fallback helpers (used when Realm is not configured)
const DEMO_USERS = [
  { id: 'demo-customer', email: 'customer@example.com', name: 'Demo Customer', role: 'customer', password: 'password' },
  { id: 'demo-vendor', email: 'vendor@example.com', name: 'Demo Vendor', role: 'vendor', password: 'password' },
];

const SESSION_KEY = 'aquaflow_demo_user';

export const loginWithEmail = async (email: string, password: string) => {
  if (!realmApp) {
    // Demo fallback: check built-in demo accounts first
    const foundStatic = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (foundStatic) {
      const demoUser = { id: foundStatic.id, profile: { email: foundStatic.email, name: foundStatic.name } };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser)); } catch (e) { console.debug('sessionStorage set failed', e); }
      return demoUser as unknown as Record<string, unknown>;
    }

    // Then check users registered via demo signup (localStorage)
    try {
      const raw = localStorage.getItem('aquaflow_demo_registered') || '[]';
      const users = JSON.parse(raw) as Array<Record<string, unknown>>;
      const found = users.find(u => (u.email as string) === email && (u.password as string) === password);
      if (found) {
        const id = (found.id as string) || `demo-${Math.random().toString(36).slice(2,9)}`;
        const demoUser = { id, profile: { email: (found.email as string), name: (found.name as string) || email.split('@')[0] } };
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser)); } catch (e) { console.debug('sessionStorage set failed', e); }
        return demoUser as unknown as Record<string, unknown>;
      }
    } catch (e) {
      console.debug('Failed to read demo registered users', e);
    }

    const err = new Error('Invalid email or password (demo)');
    interface StatusError extends Error { status?: number }
    (err as StatusError).status = 401;
    throw err;
  }

  const credentials = Realm.Credentials.emailPassword(email, password);
  const user = await realmApp.logIn(credentials);
  return user;
};

export const registerWithEmail = async (email: string, password: string, name?: string, role?: string) => {
  if (!realmApp) {
    // Demo fallback: persist to localStorage as a lightweight mock (not secure)
    const usersRaw = localStorage.getItem('aquaflow_demo_registered') || '[]';
    const users = JSON.parse(usersRaw) as Array<Record<string, unknown>>;
    if (users.find(u => (u.email as string) === email)) {
      throw new Error('User already exists (demo)');
    }
    const id = `demo-${Math.random().toString(36).slice(2, 9)}`;
    const newUser = { id, email, password, name: name || '', role: role || 'customer' };
    users.push(newUser);
    localStorage.setItem('aquaflow_demo_registered', JSON.stringify(users));

    // Auto-login the newly created demo user by creating a session
    const demoUser = { id, profile: { email, name: name || email.split('@')[0] } };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoUser)); } catch (e) { console.debug('sessionStorage set failed', e); }
    return;
  }
  // Realm email/password registration
  await realmApp.emailPasswordAuth.registerUser({ email, password });
};

export const logout = async () => {
  if (!realmApp) {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { console.debug('sessionStorage remove failed', e); }
    return;
  }
  if (realmApp.currentUser) await realmApp.currentUser.logOut();
};

export const getCurrentUser = () => {
  if (!realmApp) {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  return realmApp.currentUser || null;
};

export const getMongoClient = (dbName = 'aqua_flow') => {
  if (!realmApp?.currentUser) throw new Error('Not authenticated to MongoDB Realm');
  const mongo = realmApp.currentUser.mongoClient('mongodb-atlas');
  const db = mongo.db(dbName);
  return db;
};
