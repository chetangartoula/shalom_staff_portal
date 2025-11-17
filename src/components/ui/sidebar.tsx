
"use client";
import React from 'react';
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { Home, Calculator, ClipboardList, Users, Settings, Mountain, MoreVertical, LogOut, Loader2, Users2, Backpack, BookUser, Wallet } from "lucide-react";

import { cn } from "@/lib/utils"
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from '@/lib/auth';

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  user: User | null;
  onLinkClick?: () => void;
}

export const Sidebar = React.memo(function Sidebar({ className, isCollapsed, user, onLinkClick }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();


    const handleLogout = () => {
        // In a real app, you'd call an API endpoint to clear the session/cookie
        router.push('/login');
    };

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
        { href: "/reports", label: "All Reports", icon: ClipboardList },
        { href: "/assignments", label: "Team Assignments", icon: BookUser },
        { href: "/payments", label: "Payments", icon: Wallet },
        { href: "/travelers", label: "All Travelers", icon: Users },
        { href: "/guides", label: "Guides", icon: Users2 },
        { href: "/porters", label: "Porters", icon: Backpack },
    ];

    const NavLink = ({ item, isCollapsed, onLinkClick }: { item: typeof navItems[0], isCollapsed: boolean, onLinkClick?: () => void }) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) || (pathname === "/" && item.href === "/dashboard");
        const Icon = item.icon;

        const linkContent = (
             <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-muted-foreground transition-all group-hover:text-sidebar-foreground",
                isActive && "text-sidebar-foreground bg-sidebar-active-background font-bold",
                isCollapsed && "justify-center"
            )}>
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                 <span className="sr-only">{item.label}</span>
            </div>
        );

        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={item.href} className="group" onClick={onLinkClick}>{linkContent}</Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right"><p>{item.label}</p></TooltipContent>}
                </Tooltip>
            </TooltipProvider>
        );
    };
    
    const getUserInitials = (name: string) => {
        if (!name) return "";
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.substring(0, 2);
    }

    return (
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 h-full flex-col border-r bg-sidebar-background transition-all duration-300 ease-in-out", 
                isCollapsed ? "w-14" : "w-60",
                className
            )}>
                <div className="flex h-14 items-center border-b border-sidebar-foreground/10 px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground" onClick={onLinkClick}>
                        <Mountain className="h-6 w-6" />
                        {!isCollapsed && <span className="">Shalom</span>}
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className={cn("grid items-start text-sm font-medium tracking-wide px-2")}>
                        {navItems.map(item => (
                            <NavLink key={item.label} item={item} isCollapsed={isCollapsed} onLinkClick={onLinkClick} />
                        ))}
                    </nav>
                </div>
                <div className="mt-auto border-t border-sidebar-foreground/10 p-2">
                    {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("w-full h-auto p-2 flex items-center gap-3 hover:bg-sidebar-active-background", isCollapsed ? 'justify-center' : 'justify-start')}>
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="text-left overflow-hidden">
                                        <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
                                        <p className="text-xs text-sidebar-muted-foreground truncate">{user.email}</p>
                                    </div>
                                )}
                                {!isCollapsed && <MoreVertical className="h-4 w-4 ml-auto text-sidebar-muted-foreground" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56 bg-background">
                            <DropdownMenuLabel>
                                <p>{user.name}</p>
                                <p className="text-xs text-muted-foreground font-normal">{user.role}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                </div>
            </div>
    )
});
