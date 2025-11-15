
import { NextResponse } from 'next/server';
import { services } from '../data';

export async function GET() {
  // In a real app, you'd fetch this from a database
  return NextResponse.json({ services });
}
