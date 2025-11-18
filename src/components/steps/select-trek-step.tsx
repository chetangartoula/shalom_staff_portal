import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { cn } from "@/lib/utils";
import type { Trek } from "@/lib/types";
import { Mountain, Search } from 'lucide-react';
import { Logo } from '../logo';

interface SelectTrekStepProps {
  treks: Trek[];
  selectedTrekId: string | null;
  onSelectTrek: (id: string) => void;
}

function SelectTrekStepComponent({ treks, selectedTrekId, onSelectTrek }: SelectTrekStepProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTreks = useMemo(() => {
    if (!searchTerm) return treks;
    return treks.filter(trek =>
      trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trek.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, treks]);

  return (
    <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">New Cost Report</h2>
        <p className="mt-2 text-muted-foreground">Select a trek to begin calculating your costs.</p>
        
        <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search treks by name or description..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {filteredTreks.length > 0 ? filteredTreks.map((trek) => (
              <Card 
                key={trek.id} 
                className={cn(
                  "cursor-pointer text-left hover:shadow-lg transition-all duration-200 border-2",
                  selectedTrekId === trek.id ? "border-primary" : "border-transparent"
                )}
                onClick={() => onSelectTrek(trek.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg mt-1">
                      <Logo className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-md font-bold">{trek.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{trek.description}</p>
                  </div>
                </CardContent>
              </Card>
            )) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No treks found matching your search.</p>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

export const SelectTrekStep = memo(SelectTrekStepComponent);
