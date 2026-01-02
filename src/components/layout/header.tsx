
"use client";

import Link from "next/link"
import {
  Settings,
  LifeBuoy,
  Menu,
  User as UserIcon,
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
import { clearAuthTokens } from "@/lib/auth-utils";

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

interface HeaderProps {
    user: User | null;
    navItems: NavItem[];
}

const MobileNavItem = ({ href, label, icon: Icon }: NavItem) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

    return (
        <SheetClose asChild>
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-4 px-4 py-2 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted",
                    isActive && "text-foreground bg-muted"
                )}
            >
                <Icon className="h-5 w-5" />
                {label}
            </Link>
        </SheetClose>
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

export function Header({ user, navItems }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
      // Clear authentication tokens from localStorage
      clearAuthTokens();
      // In a real app, this would also call an API to invalidate the session
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
        <SheetContent side="left" className="md:hidden p-0">
            <SheetHeader className="flex flex-row items-center justify-between border-b px-4 h-16 bg-background">
              <Link href="/dashboard" className="flex items-center gap-2">
                  <Logo width={120} height={25} />
              </Link>
              <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>
              <SheetTitle className="sr-only">Shalom Navigation</SheetTitle>
            </SheetHeader>
          <nav className="grid gap-2 text-base font-medium p-4">
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
                {user ? getUserInitials(user.name) : <UserIcon className="h-5 w-5" />}
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
            <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/support')}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
