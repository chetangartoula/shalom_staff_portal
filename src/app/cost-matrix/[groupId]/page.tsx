import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import { ExtraServiceCostingPage } from "@/components/dashboard/extra-service-costing-page";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { notFound } from "next/navigation";
import { getTreks } from "@/app/api/data";
import { getUser } from "@/lib/auth";
import { fetchGroupAndPackageById } from "@/lib/api-service";
import type { Trek, Report, SectionState } from "@/lib/types";

interface EditCostMatrixPageProps {
    params: {
        groupId: string;
    };
    searchParams: {
        parentId?: string;
        isExtra?: string;
    };
}

export default async function EditCostMatrixPage({ params, searchParams }: EditCostMatrixPageProps) {
    const { groupId } = await params;
    const { parentId, isExtra } = await searchParams;

    const isNewExtraInvoice = groupId === 'new' && (!!parentId || isExtra === 'true');
    const isEditingExtraInvoice = isExtra === 'true' && groupId !== 'new';

    // Fetch data from the real API
    let initialData = null;

    if (isNewExtraInvoice) {
        // Create skeleton for a new extra invoice
        const emptySection = (id: string, name: string): SectionState => ({
            id,
            name,
            rows: [],
            discountType: 'amount',
            discountValue: 0,
            discountRemarks: ""
        });

        initialData = {
            groupId: parentId || "", // Use parentId as the reference for POST
            parentGroupId: parentId || "",
            trekId: "",
            isExtraInvoice: true,
            isNew: true, // Flag for creation logic
            trekName: "New Additional Service",
            groupName: "",
            groupSize: 1,
            startDate: new Date().toISOString(),
            services: emptySection('services', 'Services'),
            permits: emptySection('permits', 'Permits & Food'),
            accommodation: emptySection('accommodation', 'Accommodation'),
            transportation: emptySection('transportation', 'Transportation'),
            extraDetails: emptySection('extraDetails', 'Extra Details'),
            serviceCharge: 10,
            customSections: [],
            reportUrl: "",
            joined: 0,
            pending: 1,
            paymentDetails: {
                totalCost: 0,
                totalPaid: 0,
                balance: 0,
                paymentStatus: 'unpaid'
            },
            overallDiscountType: 'amount',
            overallDiscountValue: 0,
            overallDiscountRemarks: ""
        } as Report & { isNew: boolean };
    } else {
        try {
            // If it's marked as an extra invoice, use the extra invoice endpoint directly
            if (isEditingExtraInvoice) {
                const { fetchExtraInvoiceByInvoiceId } = await import("@/lib/api-service");
                initialData = await fetchExtraInvoiceByInvoiceId(groupId, parentId);
                if (initialData && parentId) {
                    initialData.parentGroupId = parentId;
                }
            } else {
                // Otherwise, fetch as a regular group
                initialData = await fetchGroupAndPackageById(groupId);
            }
        } catch (error) {
            console.error('Error fetching data for groupId:', groupId, error);

            // If extra invoice fetch fails, try the general endpoint as fallback
            if (isEditingExtraInvoice) {
                try {
                    initialData = await fetchGroupAndPackageById(groupId);
                    if (initialData) {
                        initialData.isExtraInvoice = true;
                        if (parentId) {
                            initialData.parentGroupId = parentId;
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback fetch also failed:', fallbackError);
                }
            }
        }
    }

    const { treks }: { treks: Trek[] } = getTreks();
    const user = await getUser();

    if (!initialData) {
        notFound();
    }

    return (
        <DashboardLayout user={user}>
            {initialData.isExtraInvoice ? (
                <ExtraServiceCostingPage
                    initialData={initialData}
                    treks={treks}
                    user={user}
                />
            ) : (
                <TrekCostingPage
                    initialData={initialData}
                    treks={treks}
                    user={user}
                    skipGroupDetails={false}
                />
            )}
        </DashboardLayout>
    );
}
