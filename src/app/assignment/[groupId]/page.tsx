
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssignmentPageContent } from "@/components/dashboard/assignment-page-content";
import { getReportByGroupId, getGuides, getPorters, getAssignmentsByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";

interface AssignmentPageProps {
  params: {
    groupId: string;
  };
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
    const { groupId } = params;
    const user = await getUser();
    const report = getReportByGroupId(groupId);
    
    if (!report) {
        notFound();
    }
    
    // Fetch all guides and porters, not just available ones, 
    // so we can see who is currently assigned even if they are now on another tour.
    const { guides } = getGuides();
    const { porters } = getPorters();
    const initialAssignments = getAssignmentsByGroupId(groupId);

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
