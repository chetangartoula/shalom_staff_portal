// Client-side compatible version of auth utilities
// This file can be imported in client components
import { getCurrentUser, isAuthenticated } from '@/lib/auth-utils';

export interface User {
  name: string;
  email: string;
  role: string;
}

// Client-side function to get user data
// In a real app, this would make an API call to fetch user session data
export const getUserClient = async (): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check if user is authenticated and return current user info
  if (isAuthenticated()) {
    return getCurrentUser();
  }
  
  return null;
};