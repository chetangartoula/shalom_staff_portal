
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import { DialogTitle } from "@radix-ui/react-dialog";
import type { User } from "@/lib/auth";
import { Menu, PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface DashboardHeaderProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  user: User | null;
}

export function DashboardHeader({ isSidebarCollapsed, setIsSidebarCollapsed, user }: DashboardHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 border-r-0 w-60 shadow-lg">
          <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
          <Sidebar isCollapsed={false} onLinkClick={handleLinkClick} user={user} className="flex" />
        </SheetContent>
      </Sheet>
      
      <div className="w-full flex-1 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
    </header>
  );
}
