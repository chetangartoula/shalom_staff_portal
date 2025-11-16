
import { NextResponse } from 'next/server';
import { travelers } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = params;
    const travelerGroup = travelers.find(t => t.groupId === groupId);

    if (travelerGroup) {
      return NextResponse.json(travelerGroup);
    }
    // It's not an error if not found, just means no data has been submitted yet
    return NextResponse.json({ travelers: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching traveler data', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const { groupId } = params;
        const body = await request.json();
        const { traveler: submittedTraveler } = body;

        if (!submittedTraveler || !submittedTraveler.id) {
            return NextResponse.json({ message: 'Invalid traveler data submitted' }, { status: 400 });
        }

        const groupIndex = travelers.findIndex(t => t.groupId === groupId);

        if (groupIndex > -1) {
            // Group exists, update it.
            const existingGroup = travelers[groupIndex];
            
            // Find if the traveler already exists in the group to update them
            const travelerIndex = existingGroup.travelers.findIndex((t: any) => t.id === submittedTraveler.id);

            if (travelerIndex > -1) {
                // Traveler exists, update their details
                existingGroup.travelers[travelerIndex] = { ...existingGroup.travelers[travelerIndex], ...submittedTraveler };
            } else {
                // Traveler doesn't exist, add them to the group
                existingGroup.travelers.push(submittedTraveler);
            }
            
            travelers[groupIndex] = existingGroup;

            return NextResponse.json({ message: 'Traveler details updated successfully', data: travelers[groupIndex] }, { status: 200 });
        } else {
            // Group doesn't exist, create it with the first traveler.
            const newTravelerGroup = { groupId, travelers: [submittedTraveler] };
            travelers.push(newTravelerGroup);
            return NextResponse.json({ message: 'Traveler details saved successfully', data: newTravelerGroup }, { status: 201 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Error saving traveler details', error: (error as Error).message }, { status: 500 });
    }
}
