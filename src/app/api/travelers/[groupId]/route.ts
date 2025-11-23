
import { NextResponse } from 'next/server';
import { getTravelerGroup, updateTravelerGroup } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

async function sha256(str: string): Promise<string> {
  const textAsBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // Await the params object
    const travelerGroup = getTravelerGroup(groupId);

    if (travelerGroup) {
      return NextResponse.json(travelerGroup);
    }
    // It's not an error if not found, just means no data has been submitted yet
    return NextResponse.json({ travelers: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching traveler data', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // Await the params object
    const body = await request.json();
    let { traveler: submittedTraveler } = body;

    if (!submittedTraveler || !submittedTraveler.passportNumber || !submittedTraveler.phone) {
      return NextResponse.json({ message: 'Invalid traveler data submitted. Passport and phone are required.' }, { status: 400 });
    }

    const uniqueString = `${submittedTraveler.passportNumber.trim()}-${submittedTraveler.phone.trim()}`;
    const travelerId = await sha256(uniqueString);
    submittedTraveler.id = travelerId;

    const updatedGroup = updateTravelerGroup(groupId, submittedTraveler);

    if (updatedGroup) {
      return NextResponse.json({ message: 'Traveler details updated successfully', data: updatedGroup }, { status: 200 });
    }
    return NextResponse.json({ message: 'Error saving traveler details' }, { status: 500 });

  } catch (error) {
    return NextResponse.json({ message: 'Error saving traveler details', error: (error as Error).message }, { status: 500 });
  }
}
