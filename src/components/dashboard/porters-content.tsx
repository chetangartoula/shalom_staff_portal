"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Porter, PorterStatus } from '@/lib/types';

interface PortersContentProps {
    initialData: Porter[];
}

const statusColors: Record<PorterStatus, string> = {
    Available: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
    'On Trek': "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    'On Leave': "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Porters</h1>
                <p className="text-muted-foreground">View and search for all available porters.</p>
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
        <Card>
            <CardContent className="pt-6">
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
    </div>
  );
}
