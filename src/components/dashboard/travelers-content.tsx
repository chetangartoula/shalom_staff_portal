"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import type { Traveler } from '@/lib/types';


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
      (traveler.phone && traveler.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (traveler.groupName && traveler.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, travelers]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Travelers</h1>
                <p className="text-muted-foreground">View and search for all travelers across all reports.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name, group, passport..."
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
                                <TableHead>Profile</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Nationality</TableHead>
                                <TableHead>Passport No.</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Trek</TableHead>
                                <TableHead>Group Name</TableHead>
                                <TableHead>Group ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTravelers.length > 0 ? filteredTravelers.map((traveler) => (
                            <TableRow key={`${traveler.id}-${traveler.groupId}`}>
                                <TableCell>
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    {traveler.profilePicture ? (
                                        <Image src={traveler.profilePicture} alt={traveler.name} width={40} height={40} className="object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{traveler.name}</TableCell>
                                <TableCell>{traveler.nationality || 'N/A'}</TableCell>
                                <TableCell>{traveler.passportNumber}</TableCell>
                                <TableCell>{traveler.phone}</TableCell>
                                <TableCell>{traveler.trekName}</TableCell>
                                <TableCell>{traveler.groupName}</TableCell>
                                <TableCell>
                                    <Link href={`/cost-matrix/${traveler.groupId}`} className="text-blue-600 hover:underline font-mono text-sm" title={traveler.groupId}>
                                        {traveler.groupId?.substring(0, 8)}...
                                    </Link>
                                </TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                {searchTerm ? `No travelers found for "${searchTerm}".` : "No traveler data available."}
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
