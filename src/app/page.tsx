
"use client";

import TrekCostingPage from "./cost-matrix-page";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AddTrekForm, type AddTrekFormData } from "@/components/add-trek-form";
import { useToast } from "@/hooks/use-toast";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function Home() {
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);
  const { toast } = useToast();
  const [treks, setTreks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treks')
      .then(res => res.json())
      .then(data => {
        setTreks(data.treks)
      })
      .finally(() => setIsLoading(false));
  }, []);

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
