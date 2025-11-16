
"use client";

import { Menu, Mountain, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-header-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Link href="/" className="flex items-center gap-2 font-semibold text-header-foreground md:hidden">
        <Mountain className="h-6 w-6 text-primary" />
        <span className="">Shalom</span>
      </Link>
      
      <div className="w-full flex-1 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs sheet-content">
            <SheetHeader className="p-4 border-b">
               <SheetTitle>
                 <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setIsSheetOpen(false)}>
                    <Mountain className="h-6 w-6 text-primary" />
                    <span className="">Shalom</span>
                 </Link>
                </SheetTitle>
            </SheetHeader>
           <Sidebar onAddTrekClick={handleAddTrekClick} isCollapsed={false} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
