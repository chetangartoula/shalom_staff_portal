
"use client"

import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import type { User } from "@/lib/auth";

interface DashboardLayoutProps {
    children: React.ReactNode;
    user: User | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <aside className={`fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar-background transition-transform duration-300 ease-in-out md:flex ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
                <Sidebar isCollapsed={isSidebarCollapsed} user={user} />
            </aside>
            <div className={`flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'sm:pl-0' : 'sm:pl-60'}`}>
                <DashboardHeader isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} user={user}/>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8 animate-in fade-in-0 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
