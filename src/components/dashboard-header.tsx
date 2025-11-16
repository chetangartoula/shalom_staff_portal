
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { Mountain } from "lucide-react";

interface DashboardHeaderProps {
  onAddTrekClick: () => void;
}

export function DashboardHeader({ onAddTrekClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-header-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent border-0 hover:bg-accent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
             <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                <Mountain className="h-6 w-6 text-primary" />
                <span className="">Shalom Dashboard</span>
            </Link>
          </SheetHeader>
          <Sidebar onAddTrekClick={onAddTrekClick} className="flex border-r-0" />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Can add search or other header elements here */}
      </div>
    </header>
  );
}
