
import { NextResponse } from 'next/server';
import { getPorters } from '../data';

export async function GET() {
  const data = getPorters();
  return NextResponse.json(data);
}
