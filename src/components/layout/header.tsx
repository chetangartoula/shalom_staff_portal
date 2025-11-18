"use client";

import Link from "next/link"
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
  Menu,
  X
} from "lucide-react"

import { Button } from "@/components/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/shadcn/sheet"
import { Logo } from "@/components/logo";
import type { User } from "@/lib/auth"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface HeaderProps {
    user: User | null;
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
    { href: "/reports", label: "All Reports", icon: ClipboardList },
    { href: "/assignments", label: "Team Assignments", icon: BookUser },
    { href: "/payments", label: "Payments", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
    { href: "/travelers", label: "All Travelers", icon: Users },
    { href: "/guides", label: "Guides", icon: Users2 },
    { href: "/porters", label: "Porters", icon: Backpack },
];


const MobileNavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType;}) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                isActive && "text-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            {label}
        </Link>
    );
};

const getUserInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
      // In a real app, this would call an API to invalidate the session
      router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
       <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="md:hidden">
            <SheetHeader className="border-b pb-4 mb-4 bg-primary text-primary-foreground -m-6 p-6 flex-row items-center justify-between">
              <Link href="/dashboard" className="mr-6 flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="font-bold text-lg">Shalom</span>
              </Link>
              <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            {navItems.map(item => (
                <MobileNavItem key={item.href} {...item} />
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 text-right">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
            >
                <div className="w-full h-full flex items-center justify-center bg-secondary text-primary font-bold">
                {user ? getUserInitials(user.name) : <Users className="h-5 w-5" />}
                </div>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            {user && (
                <>
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                </>
            )}
            <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
