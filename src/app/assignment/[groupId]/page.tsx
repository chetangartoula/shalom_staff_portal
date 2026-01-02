import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssignmentPageContent } from "@/components/dashboard/assignment-page-content";
import { getReportByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { fetchGroupAndPackageById } from '@/lib/api-service';

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

    // Do NOT SSR-fetch protected lists (tokens are in localStorage). Fetch client-side in the component instead.
    // Provide empty arrays as initial values; the component will populate them client-side with auth.
    const guides: any[] = [];
    const porters: any[] = [];
    
    // Do NOT SSR-fetch assigned team (also protected). Let the client fetch and prefill.
    const initialAssignments = null;

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