
import { NextResponse } from 'next/server';
import { reports } from '../data';
import { travelers } from '../data';
import { treks } from '../data';
import { services } from '../data';

export async function GET() {
    const stats = {
        reports: reports.length,
        travelers: travelers.reduce((acc, group) => acc + group.travelers.length, 0),
        treks: treks.length,
        services: services.length,
    };
    return NextResponse.json(stats);
}
