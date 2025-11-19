import { NextResponse } from 'next/server';
import { 
  getAllReports, 
  getAllTravelers, 
  getAllAssignmentsWithDetails, 
  getAllTransactions,
  getGuides,
  getPorters,
  getAirportPickUp
} from '../data';

export async function GET() {
  try {
    // Fetch all required data
    const reports = getAllReports();
    const travelersData = await getAllTravelers();
    const assignments = getAllAssignmentsWithDetails();
    const transactions = getAllTransactions();
    const guidesData = getGuides();
    const portersData = getPorters();
    const airportPickUpData = getAirportPickUp();

    // Combine all data into a comprehensive structure
    const comprehensiveData = {
      reports,
      travelers: travelersData.travelers,
      assignments,
      transactions,
      guides: guidesData.guides,
      porters: portersData.porters,
      airportPickUp: airportPickUpData.airportPickUp,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(comprehensiveData);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching comprehensive data', error: (error as Error).message }, { status: 500 });
  }
}