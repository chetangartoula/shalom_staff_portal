
"use client"

import { useState, lazy, Suspense } from "react";
import dynamic from 'next/dynamic';
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";
import type { AddTrekFormData } from '@/components/add-trek-form';
import { Toaster } from "@/components/ui/toaster";


const AddTrekForm = dynamic(() => import('@/components/add-trek-form').then(mod => mod.AddTrekForm), {
    ssr: false,
    loading: () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});


interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { toast } = useToast();
    const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleAddTrekSubmit = async (data: AddTrekFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/treks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to add trek");
            }
            
            toast({
              title: "Trek Added",
              description: `${data.name} has been added.`,
            });
            setIsAddTrekModalOpen(false);
        } catch (error) {
             toast({
              variant: "destructive",
              title: "Error",
              description: (error as Error).message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {isAddTrekModalOpen && (
                <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} isSubmitting={isSubmitting} />
            )}
            <div className="flex min-h-screen w-full flex-col bg-background">
                <aside className={`fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar-background transition-transform duration-300 ease-in-out md:flex ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
                <Sidebar 
                    onAddTrekClick={() => setIsAddTrekModalOpen(true)}
                    isCollapsed={isSidebarCollapsed}
                />
                </aside>
                <div className={`flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'sm:pl-0' : 'sm:pl-60'}`}>
                <DashboardHeader onAddTrekClick={() => setIsAddTrekModalOpen} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8 animate-in fade-in-0 duration-500">
                    {children}
                </main>
                </div>
            </div>
            <Toaster />
        </>
    );
}
