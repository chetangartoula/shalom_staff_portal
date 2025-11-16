"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardContent } from '@/components/dashboard-content';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
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
                <DashboardContent />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
