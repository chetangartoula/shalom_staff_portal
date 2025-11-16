
import 'server-only';

// This is a mock user service. In a real app, this would involve
// database lookups, session validation, etc., on the server.

export interface User {
  name: string;
  email: string;
  role: string;
}

// In a real application, you would fetch this from a database or session.
// For this demo, we'll use a hardcoded user.
const mockUser: User = {
  name: 'Admin User',
  email: 'admin@shalom.com',
  role: 'Admin',
};

// This function simulates fetching the currently authenticated user on the server.
export const getUser = async (): Promise<User | null> => {
  // In a real app, you would validate a cookie or session here.
  // For now, we'll just return the mock user to simulate a logged-in state.
  return mockUser;
};
