"use client";

import { useState, useEffect } from 'react';
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import type { Trek } from "@/lib/types";
import type { User } from "@/lib/auth-client";
import { useTrips } from '@/hooks/use-trips';
import { Loader2 } from 'lucide-react';
import { getUserClient } from '@/lib/auth-client';

interface ClientCostEstimatorProps {
  initialTreks: Trek[];
  user: User | null;
}

export function ClientCostEstimator({ initialTreks, user: initialUser }: ClientCostEstimatorProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const { data: treks, isLoading, isError, error } = useTrips();
  
  // Fetch user data on client side
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserClient();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Keep initial user data if fetch fails
      }
    }
    
    if (!initialUser) {
      fetchUser();
    }
  }, [initialUser]);
  
  // Use initial treks while loading real data
  const displayTreks = isLoading ? initialTreks : (treks || initialTreks);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading treks...</p>
      </div>
    );
  }

  if (isError) {
    console.error('Error loading trips:', error);
    // Still show the page with initial data as fallback
    return <TrekCostingPage treks={initialTreks} user={user} />;
  }

  return <TrekCostingPage treks={displayTreks} user={user} />;
}