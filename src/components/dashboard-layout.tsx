
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
        <div className={`grid min-h-screen w-full ${isSidebarCollapsed ? 'md:grid-cols-[5rem_1fr]' : 'md:grid-cols-[280px_1fr]'} bg-background transition-all duration-300`}>
            <Sidebar 
              onAddTrekClick={onAddTrekClick} 
              isCollapsed={isSidebarCollapsed}
              className="border-r"
            />
            <div className="flex flex-col">
              <DashboardHeader onAddTrekClick={onAddTrekClick} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
        </div>
    );
}
