"use client"

import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

interface DashboardLayoutProps {
    children: React.ReactNode;
    onAddTrekClick: () => void;
}

export function DashboardLayout({ children, onAddTrekClick }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`grid min-h-screen w-full ${isSidebarCollapsed ? 'md:grid-cols-[5rem_1fr]' : 'md:grid-cols-[280px_1fr]'} `}>
            <div className="hidden border-r bg-sidebar-background md:block">
              <Sidebar 
                onAddTrekClick={onAddTrekClick} 
                isCollapsed={isSidebarCollapsed}
              />
            </div>
            <div className="flex flex-col">
              <DashboardHeader onAddTrekClick={onAddTrekClick} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background">
                {children}
              </main>
            </div>
        </div>
    );
}
