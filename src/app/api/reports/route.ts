import { NextResponse } from 'next/server';
import { getPaginatedReports, addReport, getAllReports } from '../data';
import { fetchGroupsAndPackages } from '@/lib/api-service';
import { getServerAccessTokenFromRequest } from '@/lib/server-auth-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search');
  
  // Extract the base URL from the request
  const baseUrl = `${new URL(request.url).protocol}//${new URL(request.url).host}`;
  
  // Extract the authorization token from the request headers
  const token = getServerAccessTokenFromRequest(request) || undefined;
  
  // Fetch from the real API
  try {
    const apiData = await fetchGroupsAndPackages(page, limit, token);
    
    // Add the full URL to the reportUrl field
    const transformedReports = apiData.reports.map(report => ({
      ...report,
      reportUrl: `${baseUrl}${report.reportUrl}`
    }));
    
    // If search parameter is provided, filter the results
    if (search) {
      const filteredReports = transformedReports.filter(report => 
        report.groupName.toLowerCase().includes(search.toLowerCase()) || 
        report.groupId.toLowerCase().includes(search.toLowerCase())
      );
      
      return NextResponse.json({
        reports: filteredReports,
        total: filteredReports.length,
        hasMore: filteredReports.length > limit,
      });
    }
    
    return NextResponse.json({
      ...apiData,
      reports: transformedReports
    });
  } catch (error: any) {
    // Check if the error is related to session expiration
    if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication'))) {
      console.error('Authentication error in reports API:', error.message);
      return NextResponse.json(
        { message: 'Authentication required', error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    try {
      // Try to get data from the local data module as a fallback
      if (search) {
        const allReports = getAllReports();
        const filteredReports = allReports.filter(report => 
          report.groupName.toLowerCase().includes(search.toLowerCase()) || 
          report.groupId.toLowerCase().includes(search.toLowerCase())
        );
        
        // Paginate the filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedReports = filteredReports.slice(startIndex, endIndex);
        
        return NextResponse.json({
          reports: paginatedReports,
          total: filteredReports.length,
          hasMore: endIndex < filteredReports.length,
        });
      }
      
      const data = getPaginatedReports(page, limit);
      return NextResponse.json(data);
    } catch (mockError) {
      console.error('Error with mock data fallback:', mockError);
      // If everything fails, return empty data
      return NextResponse.json({ reports: [], total: 0, hasMore: false });
    }
  }

  const data = getPaginatedReports(page, limit);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReport = addReport(body);
    return NextResponse.json({ message: 'Report saved successfully', report: newReport }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving report', error: (error as Error).message }, { status: 500 });
  }
}