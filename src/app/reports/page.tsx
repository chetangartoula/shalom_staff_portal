"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { ProtectedRoute } from '@/components/protected-route';
import { ReportsContent } from '@/components/reports-content';

export default function ReportsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    // This is a placeholder
    toast({
      title: "Trek Added",
      description: `${data.name} has been added.`,
    });
    setIsAddTrekModalOpen(false);
  };

  const handleEditClick = (groupId: string) => {
    router.push(`/cost-matrix/${groupId}`);
  };

  return (
    <ProtectedRoute>
      <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
      <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
        <ReportsContent onEditClick={handleEditClick} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
