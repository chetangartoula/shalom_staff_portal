
"use client";

import { useState, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/protected-route';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';

export default function DashboardPage() {
    const { toast } = useToast();
    
    // The modal logic for "Add Trek" is client-side, so it stays in this client component.
    const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);
    
    const handleAddTrekSubmit = async (data: AddTrekFormData) => {
        // This is a placeholder for now
        toast({
          title: "Trek Added",
          description: `${data.name} has been added.`,
        });
        setIsAddTrekModalOpen(false);
    };

    return (
        <ProtectedRoute>
            <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
            <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
                 <div className="space-y-8">
                    <Suspense fallback={<StatsCards.Skeleton />}>
                        {/* @ts-expect-error Server Component */}
                        <StatsCards />
                    </Suspense>
                    <Suspense fallback={<RecentReports.Skeleton />}>
                        {/* @ts-expect-error Server Component */}
                        <RecentReports />
                    </Suspense>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
