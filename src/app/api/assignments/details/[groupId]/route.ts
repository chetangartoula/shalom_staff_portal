import { NextResponse } from 'next/server';
import { getReportByGroupId, getAssignmentsByGroupId, getTravelerGroup, getGuides, getPorters, getAirportPickUp } from '../../../data';
import type { Guide, Porter, AirportPickUp } from '@/lib/types';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params; // Await the params object

    const report = getReportByGroupId(groupId);
    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    const assignments = getAssignmentsByGroupId(groupId);
    const travelerGroup = getTravelerGroup(groupId);
    const { guides: allGuides } = getGuides();
    const { porters: allPorters } = getPorters();
    const { airportPickUp: allAirportPickUp } = getAirportPickUp();

    const assignedGuideDetails = assignments?.guideIds.map((id: string) => allGuides.find((g: any) => g.id === id)).filter(Boolean);
    const assignedPorterDetails = assignments?.porterIds.map((id: string) => allPorters.find((p: any) => p.id === id)).filter(Boolean);
    const assignedAirportPickUpDetails = assignments?.guideIds.map((id: string) => allAirportPickUp.find((a: any) => a.id === id)).filter(Boolean);

    return NextResponse.json({
      report: {
        trekName: report.trekName,
        groupName: report.groupName,
        startDate: report.startDate,
        groupSize: report.groupSize,
        permits: report.permits,
        services: report.services,
      },
      travelers: travelerGroup?.travelers || [],
      guides: assignedGuideDetails || [],
      porters: assignedPorterDetails || [],
      airportPickUp: assignedAirportPickUpDetails || [],
    });

  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json({ message: 'Error fetching assignment details', error: (error as Error).message }, { status: 500 });
  }
}