
import React from 'react';
import { Mountain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Trek } from "@/lib/types";

interface SelectTrekStepProps {
  treks: Trek[];
  selectedTrekId: string | null;
  onSelectTrek: (id: string) => void;
}

export const SelectTrekStep = React.memo(function SelectTrekStep({ treks, selectedTrekId, onSelectTrek }: SelectTrekStepProps) {
  return (
    <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Adventure</h2>
        <p className="mt-2 text-muted-foreground">Select a trek to begin calculating your costs.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treks.map((trek) => (
            <Card 
              key={trek.id} 
              className={cn(
                "cursor-pointer text-left hover:shadow-lg transition-all duration-300",
                selectedTrekId === trek.id && "border-primary ring-2 ring-primary"
              )}
              onClick={() => onSelectTrek(trek.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Mountain className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">{trek.name}</h3>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{trek.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
});
