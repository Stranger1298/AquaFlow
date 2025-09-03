
/* eslint-disable react-refresh/only-export-components */
// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { realmApp, loginWithEmail, registerWithEmail, logout, getCurrentUser, getMongoClient } from '@/integrations/mongodb/client';

// Types
export type UserRole = 'customer' | 'vendor' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Init: read current user and profile
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const current = getCurrentUser();
        if (!current) return;

        const currentRec = current as unknown as Record<string, unknown>;
        const currentId = (currentRec.id as string) || '';
        const currentProfile = (currentRec.profile as Record<string, unknown> | undefined) || undefined;

        // If Realm is configured and there is an authenticated Realm user, try to fetch profile document
        if (realmApp && realmApp.currentUser) {
          try {
            const db = getMongoClient();
            const profiles = db.collection('profiles');
            const profile = await profiles.findOne({ user_id: currentId });
            setUser({
              id: currentId,
              email: (currentProfile && (currentProfile.email as string)) || '',
              name: (profile && (profile.name as string)) || (currentProfile && (currentProfile.name as string)) || 'User',
              role: (profile && ((profile.account_type as unknown) as UserRole)) || 'customer'
            });
          } catch (err) {
            console.error('Failed to load profile from Atlas', err);
            setUser({ id: currentId, email: (currentProfile && (currentProfile.email as string)) || '', name: (currentProfile && (currentProfile.name as string)) || 'User', role: 'customer' });
          }
        } else {
          // Demo/local session or Realm not initialized: use session profile if present
          setUser({ id: currentId, email: (currentProfile && (currentProfile.email as string)) || '', name: (currentProfile && (currentProfile.name as string)) || 'User', role: 'customer' });
        }
      } catch (err) {
        console.error('Realm init error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const u = await loginWithEmail(email, password);
  const uRec = u as unknown as Record<string, unknown>;
  const id = (uRec.id as string) || '';

      // If Realm configured, try to read profile
      if (realmApp) {
        try {
          const db = getMongoClient();
          const profiles = db.collection('profiles');
          const profile = await profiles.findOne({ user_id: id });
          setUser({ id, email, name: (profile && (profile.name as string)) || email.split('@')[0], role: (profile && ((profile.account_type as unknown) as UserRole)) || 'customer' });
        } catch (err) {
          console.error('Failed to read profile after login', err);
          setUser({ id, email, name: email.split('@')[0], role: 'customer' });
        }
      } else {
  const profileObj = (uRec.profile as Record<string, unknown> | undefined) || undefined;
  setUser({ id, email, name: (profileObj && (profileObj.name as string)) || email.split('@')[0], role: 'customer' });
      }

      toast({ title: 'Login successful', description: 'Welcome back!' });
    } catch (err) {
      console.error('Login error:', err);
      toast({ title: 'Login failed', description: (err as Error).message || 'Invalid email or password', variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      await registerWithEmail(email, password, name, role || 'customer');

      // If Realm is configured, registration does not automatically log the user in.
      // Log the user in now so we can create a profile document tied to their user id.
      if (realmApp) {
        try {
          const logged = await loginWithEmail(email, password);
          const rec = logged as unknown as Record<string, unknown>;
          const newId = (rec.id as string) || '';
          if (newId) {
            try {
              const db = getMongoClient();
              const profiles = db.collection('profiles');
              await profiles.insertOne({ user_id: newId, name, account_type: role || 'customer', created_at: new Date().toISOString() });
              setUser({ id: newId, email, name, role: role || 'customer' });
            } catch (err) {
              console.error('Failed to create profile in Atlas', err);
            }
          }
        } catch (err) {
          // If login after registration fails, still continue (user may verify email in Realm flows)
          console.error('Login after registration failed:', err);
        }
      } else {
        // Demo path: registerWithEmail already created session and set demo user
        const current = getCurrentUser();
        if (current) {
          const rec = current as unknown as Record<string, unknown>;
          const id = (rec.id as string) || '';
          setUser({ id, email, name, role: role || 'customer' });
        }
      }

      toast({ title: 'Registration successful', description: `Welcome, ${name}!` });
    } catch (err) {
      console.error('Registration error:', err);
      toast({ title: 'Registration failed', description: (err as Error).message || 'Failed to create account', variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
      toast({ title: 'Logged out', description: 'You have been logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      toast({ title: 'Logout failed', description: 'There was an error logging out', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
