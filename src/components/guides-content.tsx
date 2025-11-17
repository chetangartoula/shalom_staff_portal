
"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Guide, GuideStatus } from '@/lib/types';

interface GuidesContentProps {
    initialData: Guide[];
}

const statusColors: Record<GuideStatus, string> = {
    Available: "bg-green-100 text-green-800 border-green-200",
    'On Tour': "bg-blue-100 text-blue-800 border-blue-200",
    'On Leave': "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function GuidesContent({ initialData }: GuidesContentProps) {
  const [guides] = useState<Guide[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuides = useMemo(() => {
    if (!searchTerm) return guides;
    return guides.filter(guide =>
      (guide.name && guide.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guide.phone && guide.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, guides]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Guides</CardTitle>
                  <CardDescription>View and search for all available guides.</CardDescription>
              </div>
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by name or phone..."
                      className="w-full sm:w-[300px] pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGuides.length > 0 ? filteredGuides.map((guide) => (
                        <TableRow key={guide.id}>
                            <TableCell className="font-medium">{guide.name}</TableCell>
                            <TableCell>{guide.phone}</TableCell>
                            <TableCell>
                                <Badge className={cn("font-semibold", statusColors[guide.status])} variant="outline">
                                    {guide.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              {searchTerm ? `No guides found for "${searchTerm}".` : "No guide data available."}
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
