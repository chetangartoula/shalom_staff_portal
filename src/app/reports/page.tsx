
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Edit, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';

export default function ReportsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        setReports(data.reports);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load reports.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [toast]);
  
  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    // This is a placeholder
    toast({
      title: "Trek Added",
      description: `${data.name} has been added.`,
    });
    setIsAddTrekModalOpen(false);
  };

  const handleEditClick = (groupId: string) => {
    router.push(`/cost-matrix/${groupId}`);
  };

  return (
    <>
      <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
      <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>View and edit your saved cost estimation reports.</CardDescription>
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
                        <TableHead>Trek Name</TableHead>
                        <TableHead>Group ID</TableHead>
                        <TableHead>Group Size</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length > 0 ? reports.map((report) => (
                        <TableRow key={report.groupId}>
                            <TableCell className="font-medium">{report.trekName}</TableCell>
                            <TableCell>
                              <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline">
                                {report.groupId.substring(0, 8)}...
                              </Link>
                            </TableCell>
                            <TableCell>{report.groupSize}</TableCell>
                            <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(report.groupId)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No reports found.
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
    </>
  );
}
