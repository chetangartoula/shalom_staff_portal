
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
          <aside className={`fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-sidebar-background transition-transform duration-300 ease-in-out md:flex ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
            <Sidebar 
              onAddTrekClick={onAddTrekClick} 
              isCollapsed={isSidebarCollapsed}
            />
          </aside>
          <div className={`flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 ease-in-out overflow-x-hidden ${isSidebarCollapsed ? 'sm:pl-0' : 'sm:pl-60'}`}>
            <DashboardHeader onAddTrekClick={onAddTrekClick} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
    );
}
