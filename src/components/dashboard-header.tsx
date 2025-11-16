
"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import { useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";

interface DashboardHeaderProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

export function DashboardHeader({ isSidebarCollapsed, setIsSidebarCollapsed }: DashboardHeaderProps) {
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
        <SheetContent side="left" className="flex flex-col p-0 border-0 sheet-content">
          <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
          <Sidebar isCollapsed={false} onLinkClick={handleLinkClick} />
        </SheetContent>
      </Sheet>
      
      <div className="w-full flex-1 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex-1" />
      </div>
    </header>
  );
}
