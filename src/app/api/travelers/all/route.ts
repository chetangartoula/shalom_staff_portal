import { NextResponse } from 'next/server';
import { fetchAllTravelers } from '@/lib/api-service';

export async function GET() {
  try {
    // Fetch all travelers from the real API
    const travelers = await fetchAllTravelers();
    
    // Transform the API response to match the existing UI structure
    const transformedTravelers = travelers.map((traveler: any) => ({
      id: traveler.id.toString(),
      name: traveler.full_name || '',
      phone: traveler.phone_number || '',
      email: traveler.email || '',
      address: traveler.address || '',
      passportNumber: traveler.passport_number || '',
      emergencyContact: traveler.emergency_contact_name || traveler.emergency_contact_phone || '',
      nationality: traveler.nationality || '',
      profilePicture: traveler.profile_pic || '',
      groupId: traveler.package?.toString() || '',
      trekName: '', // This would need to be fetched separately
      groupName: traveler.package_name || ''
    }));
    
    return NextResponse.json({ travelers: transformedTravelers });
  } catch (error) {
    console.error("Error fetching all travelers:", error);
    // Fallback to mock data if API fails
    try {
      const { getAllTravelers } = await import('../../data');
      const data = await getAllTravelers();
      return NextResponse.json(data);
    } catch (fallbackError) {
      return NextResponse.json({ message: 'Error fetching travelers', error: (fallbackError as Error).message }, { status: 500 });
    }
  }
}