
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, pass: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
        const storedAuth = localStorage.getItem('is-authenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
            try {
                const res = await fetch('/api/user');
                const userData = await res.json();
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        }
        setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, pass: string) => {
    // Mock authentication logic
    if (username === 'admin' && pass === 'password') {
      localStorage.setItem('is-authenticated', 'true');
      setIsAuthenticated(true);
      try {
        const res = await fetch('/api/user');
        const userData = await res.json();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user data after login", error);
        // still proceed with login, but user data will be null
      }
    } else {
      throw new Error('Invalid username or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('is-authenticated');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
