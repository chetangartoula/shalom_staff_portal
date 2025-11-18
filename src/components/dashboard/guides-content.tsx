
"use client";

import { useState, useMemo } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Guide, GuideStatus } from '@/lib/types';
import useSWR from 'swr';
import { Button } from '../ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const statusColors: Record<GuideStatus, string> = {
    Available: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
    'On Tour': "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    'On Leave': "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export function GuidesContent() {
  const { data, error } = useSWR('/api/guides', fetcher);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GuideStatus>('all');
  
  const guides: Guide[] = data?.guides || [];

  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const searchMatch = (guide.name && guide.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guide.email && guide.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (guide.phone && guide.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = statusFilter === 'all' || guide.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [searchTerm, guides, statusFilter]);
  
  if (!data && !error) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-destructive">Failed to load guides.</div>;
  }
  
  const renderDesktopTable = () => (
    <div className="border rounded-lg hidden md:block">
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
                    {searchTerm || statusFilter !== 'all' ? `No guides found for the current filters.` : "No guide data available."}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
      {filteredGuides.map((guide) => (
        <Card key={guide.id}>
          <CardHeader>
            <CardTitle>{guide.name}</CardTitle>
            <div>
                <Badge className={`${statusColors[guide.status]} font-semibold`} variant="outline">
                    {guide.status}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate">{guide.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{guide.phone}</span>
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Guides</h1>
                <p className="text-muted-foreground text-sm md:text-base">View and search for all available guides.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 w-full sm:w-auto justify-start">
                            <Filter className="h-4 w-4" />
                            <span>{statusFilter === 'all' ? 'All Statuses' : statusFilter}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Available">Available</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="On Tour">On Tour</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="On Leave">On Leave</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
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
        </div>
        <Card>
            <CardContent className="pt-6">
                {renderDesktopTable()}
                {renderMobileCards()}
                {filteredGuides.length === 0 && (
                    <div className="h-24 text-center flex items-center justify-center text-muted-foreground md:hidden">
                        {searchTerm || statusFilter !== 'all' ? `No guides found for the current filters.` : "No guide data available."}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
