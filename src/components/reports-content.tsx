
"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Loader2, Copy, Check, Edit, Users, BookUser, CircleDollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Report, PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';


const TravelerDetailsModal = lazy(() => import('@/components/traveler-details-modal'));

interface ReportsContentProps {
    initialData: {
        reports: Report[];
        hasMore: boolean;
    }
}

const statusColors: Record<PaymentStatus, string> = {
    'unpaid': "text-red-600 border-red-600/50 bg-red-500/5",
    'partially paid': "text-yellow-600 border-yellow-600/50 bg-yellow-500/5",
    'fully paid': "text-green-600 border-green-600/50 bg-green-500/5",
};

export function ReportsContent({ initialData }: ReportsContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initialData.reports);
  const [filteredReports, setFilteredReports] = useState<Report[]>(initialData.reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const results = reports.filter(report =>
      (report.trekName && report.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupName && report.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupId && report.groupId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredReports(results);
  }, [searchTerm, reports]);
  
  const handleUpdatePaymentStatus = async (groupId: string, status: PaymentStatus) => {
    setReports(currentReports =>
      currentReports.map(r => r.groupId === groupId ? { ...r, paymentStatus: status } : r)
    );

    try {
        const response = await fetch(`/api/reports/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentStatus: status }),
        });

        if (!response.ok) {
            throw new Error('Failed to update payment status');
        }
        toast({ title: 'Success', description: 'Payment status updated.' });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message,
        });
        // Revert UI change on failure
         setReports(currentReports =>
            currentReports.map(r => r.groupId === groupId ? { ...r, paymentStatus: reports.find(rep => rep.groupId === groupId)!.paymentStatus } : r)
        );
    }
  };


  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setIsMoreLoading(true);

    try {
      const res = await fetch(`/api/reports?page=${nextPage}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      
      setReports(prev => [...prev, ...data.reports]);
      setHasMore(data.hasMore);
      setPage(nextPage);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load more reports.',
      });
    } finally {
      setIsMoreLoading(false);
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
        title: "Copied!",
        description: "Group ID copied to clipboard.",
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (groupId: string) => {
    router.push(`/cost-matrix/${groupId}`);
  };

  const handleAssignClick = (groupId: string) => {
    router.push(`/assignment/${groupId}`);
  };

  const handleViewTravelers = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  }

  return (
    <>
      <Suspense fallback={null}>
        <TravelerDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          report={selectedReport}
        />
      </Suspense>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>All Reports</CardTitle>
                  <CardDescription>View and edit your saved cost estimation reports.</CardDescription>
              </div>
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by trek, group name, or ID..."
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
                        <TableHead>Trek Name</TableHead>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Traveler Form</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Group Size</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReports.length > 0 ? filteredReports.map((report) => (
                        <TableRow key={report.groupId}>
                            <TableCell className="font-medium">{report.trekName}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{report.groupName}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                  <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-xs" title={report.groupId}>
                                    {report.groupId.substring(0, 8)}...
                                  </Link>
                                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                                      {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      <span className="sr-only">Copy Group ID</span>
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                       <Button variant="outline" size="sm" className={cn("capitalize w-32 justify-between", statusColors[report.paymentStatus])}>
                                            {report.paymentStatus}
                                            <CircleDollarSign className="h-4 w-4" />
                                       </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuRadioGroup
                                            value={report.paymentStatus}
                                            onValueChange={(status) => handleUpdatePaymentStatus(report.groupId, status as PaymentStatus)}
                                        >
                                            <DropdownMenuRadioItem value="unpaid">Unpaid</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="partially paid">Partially Paid</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="fully paid">Fully Paid</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            <TableCell>{report.groupSize}</TableCell>
                            <TableCell className="text-green-600 font-medium">{report.joined}</TableCell>
                            <TableCell className="text-orange-600 font-medium">{report.pending}</TableCell>
                            <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleViewTravelers(report)}>
                                        <Users className="mr-2 h-4 w-4" /> View
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAssignClick(report.groupId)}>
                                        <BookUser className="mr-2 h-4 w-4" /> Assign
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(report.groupId)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                              No reports found.
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
         {hasMore && !searchTerm && (
          <CardFooter className="justify-center pt-6">
            <Button onClick={handleLoadMore} disabled={isMoreLoading}>
              {isMoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
