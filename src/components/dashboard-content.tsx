
"use client";

// This component is a client-side wrapper that can contain server components as children.
// It no longer manages the modal state, as that has been moved to the layout.
export function DashboardContent({ children }: { children: React.ReactNode }) {
    return (
        <>
          {children}
        </>
    );
}
