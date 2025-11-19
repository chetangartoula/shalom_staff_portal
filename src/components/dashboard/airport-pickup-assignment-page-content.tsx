"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { Loader2, Save, Search, User, X, Plane } from 'lucide-react';
import type { AirportPickUp, Assignment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Report {
    groupId: string;
    trekName: string;
    groupName: string;
}

interface AirportPickupAssignmentPageContentProps {
    report: Report;
    allAirportPickUp: AirportPickUp[];
    initialAssignments: Assignment | null;
}

export function AirportPickupAssignmentPageContent({ report, allAirportPickUp, initialAssignments }: AirportPickupAssignmentPageContentProps) {
    const [selectedAirportPickUpIds, setSelectedAirportPickUpIds] = useState<string[]>(initialAssignments?.guideIds || []); // Using guideIds for consistency
    const [airportPickUpSearch, setAirportPickUpSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleAirportPickUpSelect = (airportPickUpId: string) => {
        setSelectedAirportPickUpIds(prev =>
            prev.includes(airportPickUpId) ? prev.filter(id => id !== airportPickUpId) : [...prev, airportPickUpId]
        );
    };

    const isAirportPickUpAssigned = (airportPickUpId: string) => selectedAirportPickUpIds.includes(airportPickUpId);

    const availableAirportPickUp = useMemo(() => {
        return allAirportPickUp?.filter(airportPickUp => airportPickUp.status === 'Available' || isAirportPickUpAssigned(airportPickUp.id)) || [];
    }, [allAirportPickUp, selectedAirportPickUpIds]);

    const filteredAirportPickUp = useMemo(() => {
        return availableAirportPickUp?.filter(airportPickUp =>
            airportPickUp.name.toLowerCase().includes(airportPickUpSearch.toLowerCase())
        ) || [];
    }, [availableAirportPickUp, airportPickUpSearch]);

    const selectedAirportPickUp = useMemo(() => allAirportPickUp?.filter(a => selectedAirportPickUpIds.includes(a.id)) || [], [allAirportPickUp, selectedAirportPickUpIds]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/assignments/${report.groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guideIds: selectedAirportPickUpIds, porterIds: initialAssignments?.porterIds || [] }), // Keep existing porter assignments
            });

            if (!response.ok) {
                throw new Error('Failed to save airport pickup assignments');
            }

            toast({
                title: 'Success!',
                description: 'Airport pickup assignments have been saved.',
            });
            router.push('/assignments');
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: (error as Error).message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const TeamMemberSelection = ({ title, items, selectedIds, onSelect, search, onSearch, icon: Icon, getStatus }: any) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" /> {title}</CardTitle>
                <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search available ${title.toLowerCase()}...`}
                        className="pl-8"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2 border rounded-md p-2">
                    {items.length > 0 ? items.map((item: any) => (
                        <div key={item.id} className={cn(
                            "flex items-center space-x-2 p-2 rounded-md hover:bg-muted",
                            selectedIds.includes(item.id) && "bg-primary/10"
                        )}>
                            <Checkbox
                                id={`${title}-${item.id}`}
                                checked={selectedIds.includes(item.id)}
                                onCheckedChange={() => onSelect(item.id)}
                                disabled={!selectedIds.includes(item.id) && item.status !== 'Available'}
                            />
                            <Label htmlFor={`${title}-${item.id}`} className={cn(
                                "flex-grow cursor-pointer",
                                !selectedIds.includes(item.id) && item.status !== 'Available' && "cursor-not-allowed opacity-50"
                            )}>
                                <div className="flex justify-between items-center">
                                  <span>{item.name}</span>
                                  {getStatus(item)}
                                </div>
                            </Label>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center p-4">No available {title.toLowerCase()}.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    const getStatusBadge = (member: AirportPickUp) => {
        const isSelected = selectedAirportPickUpIds.includes(member.id);
        if (isSelected) {
            return <Badge variant="outline" className="bg-primary/20 border-primary/50 text-primary">Assigned to this group</Badge>;
        }
        if (member.status !== 'Available') {
            return <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{member.status}</Badge>;
        }
        return <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">Available</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Assign Airport Pickup</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    Assign airport pickup personnel for trek <span className="font-semibold text-primary">{report.trekName}</span> (Group: {report.groupName}).
                </p>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
                <TeamMemberSelection
                    title="Airport Pickup Personnel"
                    items={filteredAirportPickUp}
                    selectedIds={selectedAirportPickUpIds}
                    onSelect={handleAirportPickUpSelect}
                    search={airportPickUpSearch}
                    onSearch={setAirportPickUpSearch}
                    icon={Plane}
                    getStatus={getStatusBadge}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h3 className="font-semibold mb-2">Selected Airport Pickup Personnel ({selectedAirportPickUp.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedAirportPickUp.length > 0 ? selectedAirportPickUp.map(a => (
                                <Badge key={a.id} variant="secondary" className="text-sm py-1">
                                    {a.name}
                                    <button onClick={() => handleAirportPickUpSelect(a.id)} className="ml-2 rounded-full hover:bg-background p-0.5">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </Badge>
                            )) : <p className="text-sm text-muted-foreground">No airport pickup personnel selected.</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Assignments
                </Button>
            </div>
        </div>
    );
}