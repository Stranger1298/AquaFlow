
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

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
  logout: () => void;
}

// Mock data for demonstration
const MOCK_USERS = [
  { id: '1', email: 'vendor@example.com', password: 'password', name: 'Water Corp', role: 'vendor' as UserRole },
  { id: '2', email: 'customer@example.com', password: 'password', name: 'John Doe', role: 'customer' as UserRole },
];

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('hydrate_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          (u) => u.email === email && u.password === password && u.role === role
        );
        
        if (foundUser) {
          // Remove password before storing
          const { password, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('hydrate_user', JSON.stringify(userWithoutPassword));
          toast({
            title: "Login successful",
            description: `Welcome back, ${userWithoutPassword.name}!`,
          });
          setIsLoading(false);
          resolve();
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
          setIsLoading(false);
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  // Register function
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userExists = MOCK_USERS.some((u) => u.email === email);
        
        if (userExists) {
          toast({
            title: "Registration failed",
            description: "Email already exists",
            variant: "destructive",
          });
          setIsLoading(false);
          reject(new Error('Email already in use'));
          return;
        }
        
        // In a real app, we would create the user in the database
        // For now, simulate a successful registration
        const newUser = {
          id: `user_${Date.now()}`,
          email,
          name,
          role,
        };
        
        setUser(newUser);
        localStorage.setItem('hydrate_user', JSON.stringify(newUser));
        toast({
          title: "Registration successful",
          description: `Welcome, ${name}!`,
        });
        setIsLoading(false);
        resolve();
      }, 1000);
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('hydrate_user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
