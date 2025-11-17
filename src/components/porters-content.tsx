
"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Porter, PorterStatus } from '@/lib/types';

interface PortersContentProps {
    initialData: Porter[];
}

const statusColors: Record<PorterStatus, string> = {
    Available: "bg-green-100 text-green-800 border-green-200",
    'On Trek': "bg-blue-100 text-blue-800 border-blue-200",
    'On Leave': "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function PortersContent({ initialData }: PortersContentProps) {
  const [porters] = useState<Porter[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPorters = useMemo(() => {
    if (!searchTerm) return porters;
    return porters.filter(porter =>
      (porter.name && porter.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (porter.phone && porter.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, porters]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Porters</CardTitle>
                  <CardDescription>View and search for all available porters.</CardDescription>
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
                        {filteredPorters.length > 0 ? filteredPorters.map((porter) => (
                        <TableRow key={porter.id}>
                            <TableCell className="font-medium">{porter.name}</TableCell>
                            <TableCell>{porter.phone}</TableCell>
                            <TableCell>
                                <Badge className={`${statusColors[porter.status]} font-semibold`} variant="outline">
                                    {porter.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              {searchTerm ? `No porters found for "${searchTerm}".` : "No porter data available."}
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
