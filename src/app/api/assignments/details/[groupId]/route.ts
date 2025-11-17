
import { NextResponse } from 'next/server';
import { getReportByGroupId, getAssignmentsByGroupId, getTravelerGroup, getGuides, getPorters } from '../../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = params;
    
    const report = getReportByGroupId(groupId);
    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    const assignments = getAssignmentsByGroupId(groupId);
    const travelerGroup = getTravelerGroup(groupId);
    const { guides: allGuides } = getGuides();
    const { porters: allPorters } = getPorters();

    const assignedGuideDetails = assignments?.guideIds.map(id => allGuides.find(g => g.id === id)).filter(Boolean);
    const assignedPorterDetails = assignments?.porterIds.map(id => allPorters.find(p => p.id === id)).filter(Boolean);
    
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
    });

  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json({ message: 'Error fetching assignment details', error: (error as Error).message }, { status: 500 });
  }
}
