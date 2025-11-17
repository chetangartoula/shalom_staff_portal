
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { AssignmentPageContent } from "@/components/assignment-page-content";
import { getReportByGroupId, getGuides, getPorters, getAssignmentsByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";

interface AssignmentPageProps {
  params: {
    groupId: string;
  };
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
    const { groupId } = params;
    const report = getReportByGroupId(groupId);
    
    if (!report) {
        notFound();
    }
    
    const { guides } = getGuides();
    const { porters } = getPorters();
    const initialAssignments = getAssignmentsByGroupId(groupId);

    return (
        <DashboardLayoutShell>
            <AssignmentPageContent 
                report={report}
                allGuides={guides}
                allPorters={porters}
                initialAssignments={initialAssignments}
            />
        </DashboardLayoutShell>
    );
}
