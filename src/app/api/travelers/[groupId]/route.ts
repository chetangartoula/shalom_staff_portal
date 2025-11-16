
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
    return NextResponse.json({ message: 'No traveler data found for this group' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching traveler data', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const { groupId } = params;
        const body = await request.json();
        const { travelers: submittedTravelers } = body;

        const groupIndex = travelers.findIndex(t => t.groupId === groupId);

        if (groupIndex > -1) {
            // Group exists, update it.
            const existingGroup = travelers[groupIndex];
            
            // Create a map of existing travelers by ID for easy lookup
            const existingTravelersMap = new Map(existingGroup.travelers.map((t: any) => [t.id, t]));

            // Merge submitted travelers with existing ones
            submittedTravelers.forEach((traveler: any) => {
                existingTravelersMap.set(traveler.id, traveler);
            });

            // Update the group with the merged list
            travelers[groupIndex].travelers = Array.from(existingTravelersMap.values());

            return NextResponse.json({ message: 'Traveler details updated successfully', data: travelers[groupIndex] }, { status: 200 });
        } else {
            // Group doesn't exist, create it.
            const newTravelerGroup = { groupId, travelers: submittedTravelers };
            travelers.push(newTravelerGroup);
            return NextResponse.json({ message: 'Traveler details saved successfully', data: newTravelerGroup }, { status: 201 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Error saving traveler details', error: (error as Error).message }, { status: 500 });
    }
}
