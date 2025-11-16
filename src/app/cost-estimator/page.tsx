
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import TrekCostingPage from "../cost-matrix-page";
import type { Trek } from "@/lib/types";


export default function NewCostReportPage() {
  const { toast } = useToast();
  const [treks, setTreks] = useState<Trek[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTreks = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/treks');
        if (!response.ok) {
            throw new Error('Failed to fetch treks');
        }
        const data = await response.json();
        setTreks(data.treks);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load treks. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTreks();
  }, [fetchTreks]);

  return (
    <ProtectedRoute>
       <DashboardLayout>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TrekCostingPage treks={treks} setTreks={setTreks} />
        )}
       </DashboardLayout>
    </ProtectedRoute>
  );
}
