
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Edit, Users, Backpack, UserCheck, MoreVertical, Loader2, Plane } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Guide, Porter, AirportPickUp } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/auth-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";


interface Assignment {
    groupId: string;
    trekName: string;
    groupName: string;
    startDate: string;
    guides: Guide[];
    porters: Porter[];
    airportPickUp: AirportPickUp[];
}

export function AssignmentsContent() {
    const { data, error, isLoading } = useQuery({
        queryKey: ['assignments'],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch('/api/assignments', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch assignments');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    });
    
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const assignments: Assignment[] = data?.assignments || [];

    const filteredAssignments = useMemo(() => {
        if (!searchTerm) return assignments;
        return assignments.filter(assignment =>
            (assignment.trekName && assignment.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (assignment.groupName && assignment.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, assignments]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center text-destructive">Failed to load assignments.</div>;
    }

    const renderDesktopTable = () => (
        <div className="border rounded-lg hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Trek Name</TableHead>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Assigned Guides</TableHead>
                        <TableHead>Assigned Porters</TableHead>
                        <TableHead>Assigned Airport Pickup</TableHead>
                        <TableHead>Vehicle Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.groupId}>
                            <TableCell className="font-medium">{assignment.trekName}</TableCell>
                            <TableCell>{assignment.groupName}</TableCell>
                            <TableCell>{assignment.startDate ? format(new Date(assignment.startDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {assignment.guides.length > 0 ? assignment.guides.map(g => (
                                        <Badge key={g.id} variant="secondary" className="gap-1.5"><Users className="h-3 w-3" /> {g.name}</Badge>
                                    )) : <span className="text-muted-foreground text-xs">None</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {assignment.porters.length > 0 ? assignment.porters.map(p => (
                                        <Badge key={p.id} variant="secondary" className="gap-1.5"><Backpack className="h-3 w-3" /> {p.name}</Badge>
                                    )) : <span className="text-muted-foreground text-xs">None</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {assignment.airportPickUp.length > 0 ? assignment.airportPickUp.map(a => (
                                        <div key={a.id} className="flex flex-col">
                                            <Badge variant="secondary" className="gap-1.5 self-start"><Plane className="h-3 w-3" /> {a.name}</Badge>
                                            {(a.vehicleType || a.licensePlate) && (
                                                <div className="text-xs text-muted-foreground ml-5">
                                                    {a.vehicleType && <span>{a.vehicleType}</span>}
                                                    {a.vehicleType && a.licensePlate && <span>, </span>}
                                                    {a.licensePlate && <span>{a.licensePlate}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )) : <span className="text-muted-foreground text-xs">None</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {assignment.airportPickUp.length > 0 ? assignment.airportPickUp.map(a => (
                                        <div key={a.id} className="flex flex-col">
                                            {(a.vehicleType || a.licensePlate || a.driverName || a.driverContact) ? (
                                                <div className="text-xs">
                                                    {a.vehicleType && <div><span className="font-medium">Vehicle:</span> {a.vehicleType}</div>}
                                                    {a.licensePlate && <div><span className="font-medium">Plate:</span> {a.licensePlate}</div>}
                                                    {a.driverName && <div><span className="font-medium">Driver:</span> {a.driverName}</div>}
                                                    {a.driverContact && <div><span className="font-medium">Contact:</span> {a.driverContact}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">No vehicle details</span>
                                            )}
                                        </div>
                                    )) : (
                                        <span className="text-muted-foreground text-xs">No airport pickup assigned</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/assignment/${assignment.groupId}`)}>
                                    <Edit className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const renderMobileCards = () => (
        <div className="space-y-4 md:hidden">
            {filteredAssignments.map((assignment) => (
                <Card key={assignment.groupId}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{assignment.trekName}</CardTitle>
                                <CardDescription>{assignment.groupName}</CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/assignment/${assignment.groupId}`)}>
                                        <Edit className="mr-2 h-4 w-4" /> Manage
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date</span>
                        <span>{assignment.startDate ? format(new Date(assignment.startDate), 'PPP') : 'N/A'}</span>
                    </div>
                     <div>
                        <h4 className="font-medium mb-2">Guides</h4>
                         <div className="flex items-center gap-2 flex-wrap">
                            {assignment.guides.length > 0 ? assignment.guides.map(g => (
                                <Badge key={g.id} variant="secondary" className="gap-1.5"><Users className="h-3 w-3" /> {g.name}</Badge>
                            )) : <span className="text-muted-foreground text-xs">None</span>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Porters</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                            {assignment.porters.length > 0 ? assignment.porters.map(p => (
                                <Badge key={p.id} variant="secondary" className="gap-1.5"><Backpack className="h-3 w-3" /> {p.name}</Badge>
                            )) : <span className="text-muted-foreground text-xs">None</span>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Airport Pickup</h4>
                        <div className="flex flex-col gap-2">
                            {assignment.airportPickUp.length > 0 ? assignment.airportPickUp.map(a => (
                                <div key={a.id} className="flex flex-col">
                                    <Badge variant="secondary" className="gap-1.5 self-start"><Plane className="h-3 w-3" /> {a.name}</Badge>
                                    {(a.vehicleType || a.licensePlate) && (
                                        <div className="text-xs text-muted-foreground ml-5">
                                            {a.vehicleType && <span>{a.vehicleType}</span>}
                                            {a.vehicleType && a.licensePlate && <span>, </span>}
                                            {a.licensePlate && <span>{a.licensePlate}</span>}
                                        </div>
                                    )}
                                </div>
                            )) : <span className="text-muted-foreground text-xs">None</span>}
                        </div>
                    </div>
                    {/* Vehicle Details Section for Mobile */}
                    {assignment.airportPickUp.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Vehicle Details</h4>
                            <div className="flex flex-col gap-2">
                                {assignment.airportPickUp.map(a => (
                                    <div key={a.id} className="flex flex-col border-l-2 border-muted pl-2">
                                        {(a.vehicleType || a.licensePlate || a.driverName || a.driverContact) ? (
                                            <div className="text-xs space-y-1">
                                                {a.vehicleType && <div><span className="font-medium">Vehicle:</span> {a.vehicleType}</div>}
                                                {a.licensePlate && <div><span className="font-medium">Plate:</span> {a.licensePlate}</div>}
                                                {a.driverName && <div><span className="font-medium">Driver:</span> {a.driverName}</div>}
                                                {a.driverContact && <div><span className="font-medium">Contact:</span> {a.driverContact}</div>}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">No vehicle details available</span>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Assignments</h1>
                    <p className="text-muted-foreground text-sm md:text-base">View and manage guide and porter assignments for all groups.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by trek or group name..."
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
                    {filteredAssignments.length === 0 && (
                         <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                            No assignments found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
