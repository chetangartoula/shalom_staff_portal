
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';

interface Traveler {
    id: string;
    name: string;
    phone: string;
    address: string;
    passportNumber: string;
    emergencyContact: string;
    dateOfBirth?: string;
    nationality?: string;
    passportExpiryDate?: string;
    groupId: string;
    trekName: string;
}

interface TravelersContentProps {
    initialData: Traveler[];
}

export function TravelersContent({ initialData }: TravelersContentProps) {
  const [travelers] = useState<Traveler[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTravelers = useMemo(() => {
    if (!searchTerm) return travelers;
    return travelers.filter(traveler =>
      (traveler.name && traveler.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (traveler.passportNumber && traveler.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (traveler.phone && traveler.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, travelers]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Traveler Database</CardTitle>
                  <CardDescription>View and search for all travelers across all reports.</CardDescription>
              </div>
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by name, passport, or phone..."
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
                            <TableHead>Nationality</TableHead>
                            <TableHead>Passport No.</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Trek</TableHead>
                            <TableHead>Group ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTravelers.length > 0 ? filteredTravelers.map((traveler) => (
                        <TableRow key={traveler.id}>
                            <TableCell className="font-medium">{traveler.name}</TableCell>
                            <TableCell>{traveler.nationality || 'N/A'}</TableCell>
                            <TableCell>{traveler.passportNumber}</TableCell>
                            <TableCell>{traveler.phone}</TableCell>
                            <TableCell>{traveler.trekName}</TableCell>
                            <TableCell>
                                <Link href={`/cost-matrix/${traveler.groupId}`} className="text-blue-600 hover:underline font-mono text-sm" title={traveler.groupId}>
                                    {traveler.groupId.substring(0, 8)}...
                                </Link>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              {searchTerm ? `No travelers found for "${searchTerm}".` : "No traveler data available."}
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
