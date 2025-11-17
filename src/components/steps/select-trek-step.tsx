
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Trek } from "@/lib/types";
import { Mountain } from 'lucide-react';

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
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            {treks.map((trek) => (
              <Card 
                key={trek.id} 
                className={cn(
                  "cursor-pointer text-left hover:shadow-md transition-all duration-200",
                  selectedTrekId === trek.id && "border-primary ring-2 ring-primary"
                )}
                onClick={() => onSelectTrek(trek.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg mt-1">
                      <Mountain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-md font-bold">{trek.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{trek.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </div>
  );
});
