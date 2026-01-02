"use client";

import { useEffect } from 'react';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { Loader2, Save, Search, User, X, Users2, Backpack } from 'lucide-react';
import type { Guide, Porter, Assignment } from '@/lib/types';
import { fetchGuides, fetchPorters, fetchAssignedTeam } from '@/lib/api-service';
import { cn } from '@/lib/utils';
import { getAccessToken } from '@/lib/auth-utils';

// Add this function to call the assign team API
const assignTeamToPackage = async (guides: number[], porters: number[], packageId: number) => {
  try {
    const token = getAccessToken();
    const response = await fetch('/api/assign-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ guides, porters, package: packageId }),
    });

    if (!response.ok) {
      // Try to get error details from the response
      let errorMessage = 'Failed to assign team';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error, use the status text
        errorMessage = `Failed to assign team: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assigning team:', error);
    throw error;
  }
};

interface Report {
    groupId: string;
    trekName: string;
    groupName: string;
}

interface AssignmentPageContentProps {
    report: Report;
    allGuides: Guide[];
    allPorters: Porter[];
    initialAssignments?: Assignment | null;
}

export function AssignmentPageContent({ report, allGuides, allPorters, initialAssignments }: AssignmentPageContentProps) {
    const queryClient = useQueryClient();
    const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>(initialAssignments?.guideIds || []);
    const [selectedPorterIds, setSelectedPorterIds] = useState<string[]>(initialAssignments?.porterIds || []);
    const [guideSearch, setGuideSearch] = useState('');
    const [porterSearch, setPorterSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Client-side fetch of guides and porters (auth via fetchFromAPI)
    const { data: guidesQuery } = useQuery({
        queryKey: ['guides'],
        queryFn: async () => {
            const res = await fetchGuides();
            return res.guides as any as Guide[];
        },
        staleTime: 1000 * 60 * 5,
        retry: 2
    });
    const { data: portersQuery } = useQuery({
        queryKey: ['porters'],
        queryFn: async () => {
            const res = await fetchPorters();
            return res.porters as any as Porter[];
        },
        staleTime: 1000 * 60 * 5,
        retry: 2
    });

    // If initialAssignments are not provided, try to prefill by fetching assigned team client-side
    useEffect(() => {
        if (!initialAssignments && report?.groupId) {
            fetchAssignedTeam(parseInt(report.groupId, 10))
                .then((assigned) => {
                    if (assigned && assigned.id !== 0) {
                        setSelectedGuideIds(assigned.guides.map((id: number) => id.toString()));
                        setSelectedPorterIds(assigned.porters.map((id: number) => id.toString()));
                    }
                })
                .catch(() => {/* ignore; user can select manually */});
        }
    }, [initialAssignments, report?.groupId]);

    // Show a message when no existing assignment is found
    useEffect(() => {
        if (initialAssignments === null) {
            toast({
                title: 'New Assignment',
                description: 'No existing assignment found. You can create a new assignment below.',
            });
        }
    }, [initialAssignments, toast]);

    const handleGuideSelect = (guideId: string) => {
        setSelectedGuideIds(prev =>
            prev.includes(guideId) ? prev.filter(id => id !== guideId) : [...prev, guideId]
        );
    };

    const handlePorterSelect = (porterId: string) => {
        setSelectedPorterIds(prev =>
            prev.includes(porterId) ? prev.filter(id => id !== porterId) : [...prev, porterId]
        );
    };

    const isGuideAssigned = (guideId: string) => selectedGuideIds.includes(guideId);
    const isPorterAssigned = (porterId: string) => selectedPorterIds.includes(porterId);

    const effectiveGuides = (guidesQuery && guidesQuery.length > 0) ? guidesQuery : allGuides;
    const effectivePorters = (portersQuery && portersQuery.length > 0) ? portersQuery : allPorters;

    const availableGuides = useMemo(() => {
        return effectiveGuides.filter(guide => 
            guide.status.toLowerCase() === 'available' || isGuideAssigned(guide.id)
        );
    }, [effectiveGuides, selectedGuideIds]);

    const availablePorters = useMemo(() => {
        return effectivePorters.filter(porter => 
            porter.status.toLowerCase() === 'available' || isPorterAssigned(porter.id)
        );
    }, [effectivePorters, selectedPorterIds]);

    const filteredGuides = useMemo(() => {
        return availableGuides.filter(guide =>
            guide.name.toLowerCase().includes(guideSearch.toLowerCase())
        );
    }, [availableGuides, guideSearch]);

    const filteredPorters = useMemo(() => {
        return availablePorters.filter(porter =>
            porter.name.toLowerCase().includes(porterSearch.toLowerCase())
        );
    }, [availablePorters, porterSearch]);
    
    const selectedGuides = useMemo(() => effectiveGuides.filter(g => selectedGuideIds.includes(g.id)), [effectiveGuides, selectedGuideIds]);
    const selectedPorters = useMemo(() => effectivePorters.filter(p => selectedPorterIds.includes(p.id)), [effectivePorters, selectedPorterIds]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert string IDs to numbers for the API
            const guideIds = selectedGuideIds.map(id => parseInt(id, 10));
            const porterIds = selectedPorterIds.map(id => parseInt(id, 10));
            const packageId = parseInt(report.groupId, 10);
            
            // Assign team to package using the new API
            await assignTeamToPackage(guideIds, porterIds, packageId);
            
            // Invalidate guides and porters queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['guides'] });
            queryClient.invalidateQueries({ queryKey: ['porters'] });
            
            toast({
                title: 'Success!',
                description: 'Team assignments have been saved.',
            });
            router.push('/assignments');
            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: (error as Error).message || 'Failed to save assignments',
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
                                disabled={!selectedIds.includes(item.id) && item.status.toLowerCase() !== 'available'}
                            />
                            <Label htmlFor={`${title}-${item.id}`} className={cn(
                                "flex-grow cursor-pointer",
                                !selectedIds.includes(item.id) && item.status.toLowerCase() !== 'available' && "cursor-not-allowed opacity-50"
                            )}>
                                <div className="flex justify-between items-center">
                                  <span>{item.name}</span>
                                  {getStatus(item, title.toLowerCase() as 'guide' | 'porter')}
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

    const getStatusBadge = (member: Guide | Porter, type: 'guide' | 'porter') => {
        const isSelected = type === 'guide' 
            ? selectedGuideIds.includes(member.id) 
            : selectedPorterIds.includes(member.id);
        if (isSelected) {
            return <Badge variant="outline" className="bg-primary/20 border-primary/50 text-primary">Assigned to this group</Badge>;
        }
        if (member.status.toLowerCase() !== 'available') {
            return <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{member.status}</Badge>;
        }
        return <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">Available</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {initialAssignments ? 'Edit Team Assignment' : 'Create New Team Assignment'}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    {initialAssignments 
                        ? 'Edit the assigned guides and porters for this trek.' 
                        : 'Assign guides and porters for trek'}{' '}
                    <span className="font-semibold text-primary">{report.trekName}</span> (Group: {report.groupName}).
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <TeamMemberSelection
                    title="Guides"
                    items={filteredGuides}
                    selectedIds={selectedGuideIds}
                    onSelect={handleGuideSelect}
                    search={guideSearch}
                    onSearch={setGuideSearch}
                    icon={Users2}
                    getStatus={getStatusBadge}
                />
                <TeamMemberSelection
                    title="Porters"
                    items={filteredPorters}
                    selectedIds={selectedPorterIds}
                    onSelect={handlePorterSelect}
                    search={porterSearch}
                    onSearch={setPorterSearch}
                    icon={Backpack}
                    getStatus={getStatusBadge}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Team Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h3 className="font-semibold mb-2">Selected Guides ({selectedGuides.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedGuides.length > 0 ? selectedGuides.map(g => (
                                <Badge key={g.id} variant="secondary" className="text-sm py-1">
                                    {g.name}
                                    <button onClick={() => handleGuideSelect(g.id)} className="ml-2 rounded-full hover:bg-background p-0.5">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </Badge>
                            )) : <p className="text-sm text-muted-foreground">No guides selected.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Selected Porters ({selectedPorters.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedPorters.length > 0 ? selectedPorters.map(p => (
                               <Badge key={p.id} variant="secondary" className="text-sm py-1">
                                    {p.name}
                                    <button onClick={() => handlePorterSelect(p.id)} className="ml-2 rounded-full hover:bg-background p-0.5">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </Badge>
                            )) : <p className="text-sm text-muted-foreground">No porters selected.</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {initialAssignments ? 'Update Assignments' : 'Create Assignments'}
                </Button>
            </div>
        </div>
    );
}
