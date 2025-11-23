import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AirportPickupAssignmentPageContent } from "@/components/dashboard/airport-pickup-assignment-page-content";
import { getReportByGroupId, getAirportPickUp, getAssignmentsByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";

interface AirportPickupAssignmentPageProps {
    params: Promise<{
        groupId: string;
    }>;
}

export default async function AirportPickupAssignmentPage({ params }: AirportPickupAssignmentPageProps) {
    const { groupId } = await params;
    const user = await getUser();
    const report = getReportByGroupId(groupId);

    if (!report) {
        notFound();
    }

    // Fetch all airport pickup personnel
    const { airportPickUp } = getAirportPickUp();
    const initialAssignments = getAssignmentsByGroupId(groupId);

    return (
        <DashboardLayout user={user}>
            <AirportPickupAssignmentPageContent
                report={report}
                allAirportPickUp={airportPickUp}
                initialAssignments={initialAssignments}
            />
        </DashboardLayout>
    );
}
