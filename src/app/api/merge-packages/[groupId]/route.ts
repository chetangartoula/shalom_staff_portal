import { NextResponse } from 'next/server';
import { fetchMergePackages, updateMergePackages } from '@/lib/api-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    
    // Fetch merge packages from the real API
    try {
      const mergedPackages = await fetchMergePackages(groupId);
      return NextResponse.json({ merged_packages: mergedPackages });
    } catch (apiError) {
      console.error('Error fetching merge packages from API:', apiError);
      // Return empty array if API fails
      return NextResponse.json({ merged_packages: [] });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching merge packages', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    
    const { merge_package_ids } = body;
    
    if (!Array.isArray(merge_package_ids)) {
      return NextResponse.json({ message: 'Invalid merge_package_ids format. Expected an array.' }, { status: 400 });
    }
    
    // Update merge packages in the real API
    try {
      const result = await updateMergePackages(groupId, merge_package_ids);
      return NextResponse.json(result, { status: 200 });
    } catch (apiError) {
      console.error('Error updating merge packages in API:', apiError);
      return NextResponse.json({ message: 'Failed to update merge packages in API' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error updating merge packages', error: (error as Error).message }, { status: 500 });
  }
}