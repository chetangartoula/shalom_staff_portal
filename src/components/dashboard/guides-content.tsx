"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Guide, GuideStatus } from '@/lib/types';

interface GuidesContentProps {
    initialData: Guide[];
}

const statusColors: Record<GuideStatus, string> = {
    Available: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
    'On Tour': "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    'On Leave': "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export function GuidesContent({ initialData }: GuidesContentProps) {
  const [guides] = useState<Guide[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuides = useMemo(() => {
    if (!searchTerm) return guides;
    return guides.filter(guide =>
      (guide.name && guide.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guide.email && guide.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guide.phone && guide.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, guides]);

  return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
                <p className="text-muted-foreground">View and search for all available guides.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name, email, or phone..."
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
                                <TableHead>Email</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGuides.length > 0 ? filteredGuides.map((guide) => (
                            <TableRow key={guide.id}>
                                <TableCell className="font-medium">{guide.name}</TableCell>
                                <TableCell>{guide.email}</TableCell>
                                <TableCell>{guide.phone}</TableCell>
                                <TableCell>
                                    <Badge className={`${statusColors[guide.status]} font-semibold`} variant="outline">
                                        {guide.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                {searchTerm ? `No guides found for "${searchTerm}".` : "No guide data available."}
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
