// Client-side compatible version of auth utilities
// This file can be imported in client components

export interface User {
  name: string;
  email: string;
  role: string;
}

// Mock user for demonstration purposes
// In a real application, this would be fetched from an API endpoint
const mockUser: User = {
  name: 'Admin User',
  email: 'admin@shalom.com',
  role: 'Admin',
};

// Client-side function to get user data
// In a real app, this would make an API call to fetch user session data
export const getUserClient = async (): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In a real application, you would fetch this from an API endpoint
  // For now, we'll just return the mock user to simulate a logged-in state
  return mockUser;
};