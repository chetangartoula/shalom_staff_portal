"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { ProtectedRoute } from '@/components/protected-route';
import { TravelersContent } from '@/components/travelers-content';

export default function TravelersPage() {
  const { toast } = useToast();
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
        <TravelersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
