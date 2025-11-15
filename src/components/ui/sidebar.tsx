
"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { Mountain, Home, BarChart3, Users, LogOut, Plus } from "lucide-react"
import { useAuth } from "@/context/auth-context";

import { cn } from "@/lib/utils"
import { Button } from "./button";

interface SidebarProps {
  className?: string;
  onAddTrekClick: () => void;
}

export function Sidebar({ className, onAddTrekClick }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navItems = [
        { href: "/", label: "Dashboard", icon: Home },
        { href: "/reports", label: "Reports", icon: BarChart3 },
        { href: "/travelers", label: "Travelers", icon: Users },
    ]

    return (
        <div className={cn("hidden border-r bg-muted/40 md:flex md:flex-col", className)}>
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Mountain className="h-6 w-6 text-primary" />
                    <span className="">Shalom Dashboard</span>
                </Link>
            </div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 flex-1 py-4">
                {navItems.map(item => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname === item.href && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="mt-auto p-4 space-y-2">
                <Button variant="secondary" className="w-full" onClick={onAddTrekClick}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Trek
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
