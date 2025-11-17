
import { NextResponse } from 'next/server';
import { getTreks } from '../data';
import type { Trek } from '@/lib/types';

export async function GET() {
  const data = getTreks();
  return NextResponse.json(data);
}
