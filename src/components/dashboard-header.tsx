
"use client";

import { Menu, Mountain, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { useState } from "react";

interface DashboardHeaderProps {
  onAddTrekClick: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

export function DashboardHeader({ onAddTrekClick, isSidebarCollapsed, setIsSidebarCollapsed }: DashboardHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddTrekClick = () => {
    onAddTrekClick();
    setIsSheetOpen(false);
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-header-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent border-0 hover:bg-accent" onClick={() => setIsSheetOpen(true)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-sm border-r-0 sheet-content">
           <Sidebar onAddTrekClick={handleAddTrekClick} isCollapsed={false} />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
       <Link href="/" className="flex items-center gap-2 font-semibold text-header-foreground md:hidden">
        <Mountain className="h-6 w-6 text-primary" />
        <span className="sr-only">Shalom Dashboard</span>
      </Link>
    </header>
  );
}
