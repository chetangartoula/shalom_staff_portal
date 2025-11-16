
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard-layout";
import TrekCostingPage from "@/app/cost-matrix-page";
import type { Trek } from "@/lib/types";
import { ProtectedRoute } from "@/components/protected-route";

export default function EditCostMatrixPage() {
    const { toast } = useToast();
    const [treks, setTreks] = useState<Trek[]>([]);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const groupId = params.groupId as string;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [treksRes, reportRes] = await Promise.all([
                    fetch('/api/treks'),
                    fetch(`/api/reports/${groupId}`),
                ]);

                if (!treksRes.ok || !reportRes.ok) {
                    throw new Error('Failed to fetch initial data');
                }

                const treksData = await treksRes.json();
                const reportData = await reportRes.json();

                setTreks(treksData.treks);
                setReportData(reportData);

            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load the report data. Please try again.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (groupId) {
            fetchData();
        }
    }, [groupId, toast]);
    
    return (
       <ProtectedRoute>
         <DashboardLayout>
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TrekCostingPage treks={treks} setTreks={setTreks} initialData={reportData} />
          )}
         </DashboardLayout>
       </ProtectedRoute>
    );
}
