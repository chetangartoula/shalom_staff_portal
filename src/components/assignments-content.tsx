
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Edit, Users, Backpack, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Guide, Porter } from '@/lib/types';

interface Assignment {
    groupId: string;
    trekName: string;
    groupName: string;
    startDate: string;
    guides: Guide[];
    porters: Porter[];
}

interface AssignmentsContentProps {
    initialData: Assignment[];
}

export function AssignmentsContent({ initialData }: AssignmentsContentProps) {
    const [assignments, setAssignments] = useState<Assignment[]>(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const filteredAssignments = useMemo(() => {
        if (!searchTerm) return assignments;
        return assignments.filter(assignment =>
            (assignment.trekName && assignment.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (assignment.groupName && assignment.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, assignments]);

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <CardTitle>Team Assignments</CardTitle>
                        <CardDescription>View and manage guide and porter assignments for all groups.</CardDescription>
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
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Trek Name</TableHead>
                                <TableHead>Group Name</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Assigned Guides</TableHead>
                                <TableHead>Assigned Porters</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssignments.length > 0 ? filteredAssignments.map((assignment) => (
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
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/assignment/${assignment.groupId}`)}>
                                            <Edit className="mr-2 h-4 w-4" /> Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No assignments found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
