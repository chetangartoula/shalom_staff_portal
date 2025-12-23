import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssignmentPageContent } from "@/components/dashboard/assignment-page-content";
import { getReportByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { fetchGroupAndPackageById, fetchAssignedTeam, fetchGuides, fetchPorters } from '@/lib/api-service';

interface AssignmentPageProps {
    params: Promise<{
        groupId: string;
    }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
    const { groupId } = await params;
    const user = await getUser();
    
    // Fetch report data from the real API
    let report = null;
    try {
        report = await fetchGroupAndPackageById(groupId);
    } catch (error) {
        console.error('Error fetching report from API:', error);
        // If API fails, fall back to mock data
        const mockReport = getReportByGroupId(groupId);
        if (mockReport) {
            report = mockReport;
        }
    }
    
    if (!report) {
        notFound();
    }

    // Fetch all guides and porters from the real API
    let guides = [];
    let porters = [];
    try {
        const guidesData = await fetchGuides();
        guides = guidesData.guides;
        
        const portersData = await fetchPorters();
        porters = portersData.porters;
    } catch (error) {
        console.error('Error fetching guides/porters from API:', error);
        // If API fails, fall back to mock data
        const mockGuidesData = await import("@/app/api/data").then(module => module.getGuides());
        const mockPortersData = await import("@/app/api/data").then(module => module.getPorters());
        guides = mockGuidesData.guides;
        porters = mockPortersData.porters;
    }
    
    // Fetch initial assignments from the real API
    let initialAssignments = null;
    try {
        const assignedTeam = await fetchAssignedTeam(parseInt(groupId, 10));
        // Only set initial assignments if we got valid data (not the default 404 response)
        if (assignedTeam.id !== 0) {
            initialAssignments = {
                groupId: assignedTeam.package.toString(),
                guideIds: assignedTeam.guides.map(id => id.toString()),
                porterIds: assignedTeam.porters.map(id => id.toString())
            };
        }
    } catch (error) {
        console.error('Error fetching assigned team from API:', error);
        // If API fails, we'll leave initialAssignments as null, which means no pre-selected assignments
        // This is fine as it allows users to create new assignments
    }

    return (
        <DashboardLayout user={user}>
            <AssignmentPageContent
                report={report}
                allGuides={guides}
                allPorters={porters}
                initialAssignments={initialAssignments}
            />
        </DashboardLayout>
    );
}