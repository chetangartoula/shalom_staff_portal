
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

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle>Shalom Dashboard</SheetTitle>
          </SheetHeader>
          {/* We need to pass the click handlers to the sidebar in the mobile view */}
          <Sidebar onAddTrekClick={() => {}} />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Can add search or other header elements here */}
      </div>
    </header>
  );
}
