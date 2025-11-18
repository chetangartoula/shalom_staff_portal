"use client";

import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Porter, PorterStatus } from '@/lib/types';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const statusColors: Record<PorterStatus, string> = {
    Available: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
    'On Trek': "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    'On Leave': "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export function PortersContent() {
  const { data, error } = useSWR('/api/porters', fetcher);
  const [searchTerm, setSearchTerm] = useState('');

  const porters: Porter[] = data?.porters || [];

  const filteredPorters = useMemo(() => {
    if (!searchTerm) return porters;
    return porters.filter(porter =>
      (porter.name && porter.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (porter.phone && porter.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, porters]);

  if (!data && !error) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-destructive">Failed to load porters.</div>;
  }

  const renderDesktopTable = () => (
    <div className="border rounded-lg hidden md:block">
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
  );

  const renderMobileCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
      {filteredPorters.map((porter) => (
        <Card key={porter.id}>
          <CardHeader>
            <CardTitle className="text-lg">{porter.name}</CardTitle>
            <div className="text-sm text-muted-foreground pt-1">
                <Badge className={`${statusColors[porter.status]} font-semibold`} variant="outline">
                    {porter.status}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{porter.phone}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Porters</h1>
                <p className="text-muted-foreground text-sm md:text-base">View and search for all available porters.</p>
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
                {renderDesktopTable()}
                {renderMobileCards()}
                {filteredPorters.length === 0 && (
                    <div className="h-24 text-center flex items-center justify-center text-muted-foreground md:hidden">
                        {searchTerm ? `No porters found for "${searchTerm}".` : "No porter data available."}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
