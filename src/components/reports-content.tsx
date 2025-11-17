
"use client";

import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Search, Loader2, Copy, Check, Edit, Users, BookUser, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Report, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

const TravelerDetailsModal = lazy(() => import('@/components/traveler-details-modal'));

interface ReportsContentProps {
    initialData?: {
        reports: Report[];
        hasMore: boolean;
    },
    pageType?: 'reports' | 'payments';
}

const statusColors: Record<PaymentStatus, string> = {
    'unpaid': "text-red-600 border-red-600/50 bg-red-500/5",
    'partially paid': "text-yellow-600 border-yellow-600/50 bg-yellow-500/5",
    'fully paid': "text-green-600 border-green-600/50 bg-green-500/5",
    'overpaid': "text-purple-600 border-purple-600/50 bg-purple-500/5"
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ReportsContent({ initialData, pageType = 'reports' }: ReportsContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initialData?.reports || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [selectedReportForTravelers, setSelectedReportForTravelers] = useState<Report | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  
  // Client-side data fetching for payments page
  const { data, error, isLoading } = useSWR(pageType === 'payments' ? `/api/reports?page=1&limit=10` : null, fetcher);

  useEffect(() => {
    if (data && pageType === 'payments') {
      setReports(data.reports);
      setHasMore(data.hasMore);
    }
  }, [data, pageType]);

  const filteredReports = useMemo(() => {
    return reports.filter(report =>
      (report.trekName && report.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupName && report.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupId && report.groupId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, reports]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    
    try {
      const res = await fetch(`/api/reports?page=${nextPage}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const newData = await res.json();
      
      setReports(prev => [...prev, ...newData.reports]);
      setHasMore(newData.hasMore);
      setPage(nextPage);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load more reports.',
      });
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
    setSelectedReportForTravelers(report);
    setIsTravelerModalOpen(true);
  }

  const handleManagePayments = (groupId: string) => {
    router.push(`/payments/${groupId}`);
  }

  const cardTitle = pageType === 'payments' ? 'Payment Status' : 'All Reports';
  const cardDescription = pageType === 'payments' 
    ? 'View and manage payment status for all reports.'
    : 'View and edit your saved cost estimation reports.';

  return (
    <>
      <Suspense fallback={null}>
        <TravelerDetailsModal 
          isOpen={isTravelerModalOpen}
          onClose={() => setIsTravelerModalOpen(false)}
          report={selectedReportForTravelers}
        />
      </Suspense>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>{cardTitle}</CardTitle>
                  <CardDescription>{cardDescription}</CardDescription>
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
                        {pageType === 'reports' && <TableHead>Traveler Form</TableHead>}
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Balance</TableHead>
                        {pageType === 'reports' && <TableHead>Joined/Total</TableHead>}
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
                             {pageType === 'reports' && (
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-xs" title={report.groupId}>
                                        {report.groupId.substring(0, 8)}...
                                    </Link>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                                        {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        <span className="sr-only">Copy Report URL</span>
                                        </Button>
                                    </div>
                                </TableCell>
                             )}
                            <TableCell className="font-medium">{formatCurrency(report.paymentDetails.totalCost)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[report.paymentDetails.paymentStatus])}>
                                    {report.paymentDetails.paymentStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className={cn("font-medium", report.paymentDetails.balance > 0 ? 'text-red-600' : 'text-green-600')}>
                                {formatCurrency(report.paymentDetails.balance)}
                            </TableCell>
                            {pageType === 'reports' && (
                                <TableCell>
                                    <span className="text-green-600 font-medium">{report.joined}</span>
                                    <span className="text-muted-foreground"> / {report.groupSize}</span>
                                </TableCell>
                            )}
                            <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                    {pageType === 'payments' && (
                                        <Button variant="outline" size="sm" onClick={() => handleManagePayments(report.groupId)}>
                                            <CircleDollarSign className="mr-2 h-4 w-4" /> Manage Payments
                                        </Button>
                                    )}
                                    {pageType === 'reports' && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => handleViewTravelers(report)}>
                                                <Users className="mr-2 h-4 w-4" /> View
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAssignClick(report.groupId)}>
                                                <BookUser className="mr-2 h-4 w-4" /> Assign
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(report.groupId)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Costing
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
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
