
import { NextResponse } from 'next/server';

// This is a mock API endpoint to simulate fetching the current user's data.
// In a real application, this would fetch data from your database based on the user's session.
export async function GET() {
  const user = {
    name: 'Admin User',
    email: 'admin@shalom.com',
  };
  return NextResponse.json(user);
}
