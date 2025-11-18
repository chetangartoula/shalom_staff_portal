"use client";

import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Search, Loader2, Copy, Check, Edit, Users, BookUser, CircleDollarSign, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Report, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";


const TravelerDetailsModal = lazy(() => import('@/components/dashboard/traveler-details-modal'));

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
  
  const endpoint = `/api/reports?page=${page}&limit=10`;
  const { data, error, isLoading } = useSWR(endpoint, fetcher, {
    fallbackData: page === 1 ? initialData : undefined,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data) {
      setReports(prev => page === 1 ? data.reports : [...prev, ...data.reports.filter((newReport: Report) => !prev.some(p => p.groupId === newReport.groupId))]);
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  const filteredReports = useMemo(() => {
    return reports.filter(report =>
      (report.trekName && report.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupName && report.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupId && report.groupId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, reports]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(p => p + 1);
    }
  }, [hasMore, isLoading]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
        title: "Copied!",
        description: "Traveler form link copied to clipboard.",
    });
    setCopiedId(url);
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

  const renderMobileCards = () => (
    <div className="space-y-4 md:hidden">
      {filteredReports.map((report) => {
        const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
        return (
          <Card key={report.groupId}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{report.trekName}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1">{report.groupName}</Badge>
                  </CardDescription>
                </div>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handleManagePayments(report.groupId)}>
                          <CircleDollarSign className="mr-2 h-4 w-4" /> Manage Payments
                      </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleViewTravelers(report)}>
                        <Users className="mr-2 h-4 w-4" /> View Travelers
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleAssignClick(report.groupId)} disabled={isAssignmentDisabled}>
                       <BookUser className="mr-2 h-4 w-4" /> Assign Team
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleEditClick(report.groupId)}>
                       <Edit className="mr-2 h-4 w-4" /> Edit Costing
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">{formatCurrency(report.paymentDetails.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className={cn("font-medium", report.paymentDetails.balance > 0 ? 'text-red-600' : 'text-green-600')}>
                  {formatCurrency(report.paymentDetails.balance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn("capitalize", statusColors[report.paymentDetails.paymentStatus])}>
                  {report.paymentDetails.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined / Total</span>
                  <span>
                      <span className="text-green-600 font-medium">{report.joined}</span>
                      <span className="text-muted-foreground"> / {report.groupSize}</span>
                  </span>
              </div>
               <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Traveler Form</span>
                   <div className="flex items-center gap-1">
                      <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-xs" title={report.groupId}>
                          {report.groupId.substring(0, 8)}...
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                          {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                  </div>
              </div>
               <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );

  const renderDesktopTable = () => (
     <div className="border rounded-lg hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Trek Name</TableHead>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Traveler Form</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined/Total</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredReports.length > 0 ? filteredReports.map((report) => {
                  const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
                  return (
                    <TableRow key={report.groupId}>
                        <TableCell className="font-medium">{report.trekName}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{report.groupName}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                            <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-xs" title={report.groupId}>
                                {report.reportUrl}
                            </Link>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                                {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy Report URL</span>
                                </Button>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(report.paymentDetails.totalCost)}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("capitalize", statusColors[report.paymentDetails.paymentStatus])}>
                                {report.paymentDetails.paymentStatus}
                            </Badge>
                        </TableCell>
                        <TableCell className={cn("font-medium", report.paymentDetails.balance > 0 ? 'text-red-600' : 'text-green-600')}>
                            {formatCurrency(report.paymentDetails.balance)}
                        </TableCell>
                        <TableCell>
                            <span className="text-green-600 font-medium">{report.joined}</span>
                            <span className="text-muted-foreground"> / {report.groupSize}</span>
                        </TableCell>
                        <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleManagePayments(report.groupId)}>
                                    <CircleDollarSign className="mr-2 h-4 w-4" /> Manage
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleViewTravelers(report)}>
                                    <Users className="mr-2 h-4 w-4" /> View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleAssignClick(report.groupId)} disabled={isAssignmentDisabled} title={isAssignmentDisabled ? 'Payment required to assign team' : 'Assign guides and porters'}>
                                    <BookUser className="mr-2 h-4 w-4" /> Assign
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(report.groupId)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Costing
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                  )
                }) : (
                    <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No reports found.
                    </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );


  return (
    <>
      <Suspense fallback={null}>
        <TravelerDetailsModal 
          isOpen={isTravelerModalOpen}
          onClose={() => setIsTravelerModalOpen(false)}
          report={selectedReportForTravelers}
        />
      </Suspense>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{cardTitle}</h1>
                <p className="text-muted-foreground">{cardDescription}</p>
            </div>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search reports..."
                    className="w-full sm:w-[300px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <Card>
            <CardContent className="pt-6">
                {isLoading && page === 1 ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                ) : (
                <>
                    {renderDesktopTable()}
                    {renderMobileCards()}
                    {filteredReports.length === 0 && !isLoading && (
                        <div className="text-center text-muted-foreground py-12">
                            <p>No reports found.</p>
                        </div>
                    )}
                </>
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
      </div>
    </>
  );
}
