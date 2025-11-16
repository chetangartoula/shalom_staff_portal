
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
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <div className={`fixed inset-y-0 left-0 z-10 w-60 ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'} transition-transform duration-300 ease-in-out hidden md:flex`}>
            <Sidebar 
              onAddTrekClick={onAddTrekClick} 
              isCollapsed={isSidebarCollapsed}
            />
          </div>
            <div className={`flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'sm:pl-14' : 'sm:pl-64'}`}>
              <DashboardHeader onAddTrekClick={onAddTrekClick} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
                {children}
              </main>
            </div>
        </div>
    );
}
