
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AddTrekForm, type AddTrekFormData } from "@/components/add-trek-form";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import TrekCostingPage from "../cost-matrix-page";
import type { Trek } from "@/lib/types";


export default function NewCostReportPage() {
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);
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

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    const newTrekData = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      ...data,
    };
    try {
      const response = await fetch('/api/treks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrekData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save trek');
      }
      
      const { trek: newTrek } = await response.json();
      
      setTreks(prevTreks => [...prevTreks, newTrek]);
      
      toast({
        title: "Trek Added",
        description: `${data.name} has been added to the list.`,
      });
  
      setIsAddTrekModalOpen(false);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the new trek. Please try again.",
      });
    }
  };

  return (
    <ProtectedRoute>
       <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
       <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
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
