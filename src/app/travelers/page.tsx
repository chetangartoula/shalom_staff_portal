
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/protected-route';

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

export default function TravelersPage() {
  const { toast } = useToast();
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);

  useEffect(() => {
    const fetchTravelers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/travelers/all');
        if (!res.ok) throw new Error('Failed to fetch travelers');
        const data = await res.json();
        setTravelers(data.travelers);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load traveler data.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTravelers();
  }, [toast]);

  const filteredTravelers = useMemo(() => {
    if (!searchTerm) return travelers;
    return travelers.filter(traveler =>
      traveler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, travelers]);

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    // This is a placeholder for now
    toast({
      title: "Trek Added",
      description: `${data.name} has been added.`,
    });
    setIsAddTrekModalOpen(false);
  };

  return (
    <ProtectedRoute>
      <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
      <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
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
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
      <Toaster />
    </ProtectedRoute>
  );
}
