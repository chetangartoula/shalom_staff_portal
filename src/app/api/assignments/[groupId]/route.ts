
import { NextResponse } from 'next/server';
import { getAssignmentsByGroupId, updateAssignments } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = params;
    const assignments = getAssignmentsByGroupId(groupId);
    if (assignments) {
      return NextResponse.json(assignments);
    }
    // It's not an error if not found, just means no assignments yet
    return NextResponse.json({ groupId, guideIds: [], porterIds: [] });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching assignments', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId } = params;
    const body = await request.json();
    const { guideIds, porterIds } = body;
    const updated = updateAssignments(groupId, guideIds, porterIds);

    if (updated) {
      return NextResponse.json({ message: 'Assignments updated successfully', assignments: updated }, { status: 200 });
    }
    return NextResponse.json({ message: 'Could not update assignments' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating assignments', error: (error as Error).message }, { status: 500 });
  }
}
