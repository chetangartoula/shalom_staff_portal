
import { NextResponse } from 'next/server';
import { travelers } from '../data';

export async function GET() {
  return NextResponse.json({ travelers });
}
