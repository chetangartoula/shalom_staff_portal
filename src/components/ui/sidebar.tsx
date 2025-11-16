
"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { Mountain, Home, LogOut, Plus, Settings } from "lucide-react"
import { useAuth } from "@/context/auth-context";

import { cn } from "@/lib/utils"
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "./separator";

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onAddTrekClick: () => void;
}

export function Sidebar({ className, isCollapsed, onAddTrekClick }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navItems = [
        { href: "/", label: "Dashboard", icon: Home },
        { href: "#", label: "Add Trek", icon: Plus, action: onAddTrekClick },
        { href: "/services", label: "Services", icon: Settings },
    ];

    const NavLink = ({ item }: { item: typeof navItems[0] }) => {
        const isActive = (pathname === "/" && item.href === "/") || (item.href !== "/" && pathname.startsWith(item.href));
        
        const linkContent = (
             <span className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-all group-hover:text-sidebar-foreground",
                isActive && "text-sidebar-foreground",
                isCollapsed && "justify-center"
            )}>
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </span>
        );

        const linkElement = item.href === "#" ? (
            <a onClick={item.action} className="group">{linkContent}</a>
        ) : (
            <Link href={item.href} className="group">{linkContent}</Link>
        );

        return (
            <div className="cursor-pointer">
                {isCollapsed ? (
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    linkElement
                )}
            </div>
        );
    };

    return (
        <div className={cn("hidden bg-sidebar-background text-sidebar-foreground md:flex md:flex-col", className, isCollapsed && "items-center")}>
            <div className={cn("flex h-14 items-center border-b border-header-border/30 px-4 lg:h-[60px] lg:px-6", isCollapsed && "h-[60px] justify-center px-2")}>
                <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                    <Mountain className="h-6 w-6" />
                    {!isCollapsed && <span className="">Shalom</span>}
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2 w-full">
                <nav className={cn("grid items-start text-sm font-medium", isCollapsed ? "px-2" : "px-4")}>
                    {navItems.map(item => (
                        <NavLink key={item.label} item={item} />
                    ))}
                </nav>
            </div>
            <div className={cn("mt-auto p-4 space-y-2 border-t border-header-border/30 w-full", isCollapsed && "p-2 space-y-0")}>
                 {isCollapsed ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-full text-sidebar-muted-foreground hover:text-sidebar-foreground" onClick={handleLogout}>
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                             <TooltipContent side="right"><p>Logout</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button variant="ghost" className="w-full justify-start text-sidebar-muted-foreground hover:text-sidebar-foreground" onClick={handleLogout}>
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                    </Button>
                )}
            </div>
        </div>
    )
}
