
"use client";

import { useState, useEffect } from 'react';
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { notFound } from "next/navigation";
import { Loader2 } from 'lucide-react';

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = params;
    const [initialData, setInitialData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/reports/${groupId}`);
                if (res.status === 404) {
                    notFound();
                    return;
                }
                if (!res.ok) {
                    throw new Error("Failed to fetch report");
                }
                const data = await res.json();
                setInitialData(data);
            } catch (error) {
                console.error(error);
                // Handle error, maybe show a toast
            } finally {
                setIsLoading(false);
            }
        }
        fetchReport();
    }, [groupId]);
    
    if (isLoading) {
        return (
            <DashboardLayoutShell>
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayoutShell>
        );
    }

    return (
        <DashboardLayoutShell>
            <TrekCostingPage initialData={initialData} />
        </DashboardLayoutShell>
    );
}
