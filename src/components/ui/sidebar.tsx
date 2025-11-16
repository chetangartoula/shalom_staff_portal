
"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { Mountain, Home, LogOut, Plus, Settings, MoreVertical } from "lucide-react"
import { useAuth } from "@/context/auth-context";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onAddTrekClick: () => void;
  onLinkClick?: () => void;
}

export function Sidebar({ className, isCollapsed, onAddTrekClick, onLinkClick }: SidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
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
        
        const handleClick = (e: React.MouseEvent) => {
          if (item.action) {
            e.preventDefault();
            item.action();
          }
          if (onLinkClick) {
            onLinkClick();
          }
        };

        const linkContent = (
             <span className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-muted-foreground transition-all group-hover:text-sidebar-foreground",
                isActive && "text-sidebar-foreground bg-sidebar-active-background font-bold",
                isCollapsed && "justify-center"
            )}>
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                 <span className="sr-only">{item.label}</span>
            </span>
        );
        
        const linkElement = item.href === "#" ? (
            <a href="#" onClick={handleClick} className="group">{linkContent}</a>
        ) : (
            <Link href={item.href} className="group" onClick={handleClick}>{linkContent}</Link>
        );

        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
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
        <div className={cn("flex h-full flex-col bg-sidebar-background", className)}>
            <div className="flex h-14 items-center border-b border-sidebar-foreground/10 px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground" onClick={onLinkClick}>
                    <Mountain className="h-6 w-6" />
                    {!isCollapsed && <span className="">Shalom</span>}
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className={cn("grid items-start text-sm font-semibold tracking-wide", isCollapsed ? "px-2" : "px-4")}>
                    {navItems.map(item => (
                        <NavLink key={item.label} item={item} />
                    ))}
                </nav>
            </div>
            <div className="mt-auto border-t border-sidebar-foreground/10">
                {user && (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className={cn("w-full h-auto p-2 flex items-center gap-3", isCollapsed ? 'justify-center' : 'justify-start')}>
                              <Avatar className="h-9 w-9">
                                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              {!isCollapsed && (
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-sidebar-foreground">{user.name}</p>
                                  <p className="text-xs text-sidebar-muted-foreground">{user.email}</p>
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
}
