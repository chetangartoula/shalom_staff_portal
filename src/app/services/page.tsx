"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { ProtectedRoute } from '@/components/protected-route';
import { ServicesContent } from '@/components/services-content';

export default function ServicesPage() {
  const { toast } = useToast();
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    // This is a placeholder
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
        <ServicesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
