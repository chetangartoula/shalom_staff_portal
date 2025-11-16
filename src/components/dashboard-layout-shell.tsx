"use client";

import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';

interface DashboardLayoutShellProps {
    children: React.ReactNode;
}

export function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
