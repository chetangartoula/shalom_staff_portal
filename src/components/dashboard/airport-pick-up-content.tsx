"use client";

import { useState, useMemo } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { AirportPickUp, AirportPickUpStatus } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
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

const statusColors: Record<AirportPickUpStatus, string> = {
    Available: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
    'On Duty': "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    'On Leave': "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export function AirportPickUpContent() {
  // Use React Query to fetch airport pickup personnel from the real API
  const { data, error, isLoading } = useQuery({
    queryKey: ['airportPickUp'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/airport-pick-up');
        if (!response.ok) {
          throw new Error('Failed to fetch airport pickup personnel');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching airport pickup personnel:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AirportPickUpStatus>('all');
  
  const airportPickUp: AirportPickUp[] = data?.airportPickUp || [];

  const filteredAirportPickUp = useMemo(() => {
    return airportPickUp.filter(person => {
      const searchMatch = (person.name && person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.phone && person.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = statusFilter === 'all' || person.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [searchTerm, airportPickUp, statusFilter]);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-center text-destructive">Failed to load airport pick up personnel.</div>;
  }
  
  const renderDesktopTable = () => (
    <div className="border rounded-lg hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredAirportPickUp.length > 0 ? filteredAirportPickUp.map((person) => (
                <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell>{person.vehicleType || 'N/A'}</TableCell>
                    <TableCell>{person.licensePlate || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge className={`${statusColors[person.status]} font-semibold`} variant="outline">
                            {person.status}
                        </Badge>
                    </TableCell>
                </TableRow>
                )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    {searchTerm || statusFilter !== 'all' ? `No personnel found for the current filters.` : "No airport pick up personnel data available."}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
      {filteredAirportPickUp.map((person) => (
        <Card key={person.id}>
          <CardHeader>
            <CardTitle>{person.name}</CardTitle>
            <div>
                <Badge className={`${statusColors[person.status]} font-semibold`} variant="outline">
                    {person.status}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate">{person.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{person.phone}</span>
            </div>
            {person.vehicleType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{person.vehicleType}</span>
              </div>
            )}
            {person.licensePlate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plate</span>
                <span className="font-medium">{person.licensePlate}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Airport Pick Up</h1>
                <p className="text-muted-foreground text-sm md:text-base">View and search for all airport pick up personnel.</p>
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
                            <DropdownMenuRadioItem value="On Duty">On Duty</DropdownMenuRadioItem>
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
                {filteredAirportPickUp.length === 0 && (
                    <div className="h-24 text-center flex items-center justify-center text-muted-foreground md:hidden">
                        {searchTerm || statusFilter !== 'all' ? `No personnel found for the current filters.` : "No airport pick up personnel data available."}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}