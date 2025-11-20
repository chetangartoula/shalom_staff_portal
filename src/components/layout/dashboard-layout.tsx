"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  BookUser,
  Calculator,
  ClipboardList,
  Home,
  Users,
  Users2,
  Backpack,
  Wallet,
  PanelLeftOpen,
  PanelLeftClose,
  Plane
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from '@/lib/utils';
import type { User } from "@/lib/auth";
import { Header } from './header';
import { Logo } from '../logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/cost-estimator", label: "Quotation Builder", icon: Calculator },
  { href: "/reports", label: "Quotations", icon: ClipboardList },
  { href: "/assignments", label: "Team Assignments", icon: BookUser },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/travelers", label: "All Travelers", icon: Users },
  { href: "/guides", label: "Guides", icon: Users2 },
  { href: "/porters", label: "Porters", icon: Backpack },
  { href: "/airport-pick-up", label: "Airport Pick Up", icon: Plane },
  { href: "/comprehensive-reports", label: "Reports", icon: BookUser },
];

const NavItem = ({ href, label, icon: Icon, isExpanded }: { href: string; label: string; icon: React.ElementType; isExpanded: boolean; }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "flex items-center gap-4 h-10 px-3 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted",
              isActive && "bg-muted text-primary",
              !isExpanded && "justify-center"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className={cn("whitespace-nowrap", !isExpanded && "hidden")}>{label}</span>
          </Link>
        </TooltipTrigger>
        {!isExpanded && (
          <TooltipContent side="right">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};


export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out shadow-lg fixed h-full",
        isSidebarExpanded ? "w-64" : "w-20"
      )}>
        <div className={cn(
            "flex h-16 items-center border-b px-4 bg-background",
            isSidebarExpanded ? "justify-between" : "justify-center"
        )}>
          {isSidebarExpanded && (
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
              <Logo width={120} height={25} />
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="hover:bg-muted focus-visible:ring-primary-foreground">
            {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} isExpanded={isSidebarExpanded} />
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col md:ml-64">
        <Header user={user} navItems={navItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}