
"use client";

import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import useSWR from 'swr';
import { Search, Loader2, Copy, Check, Edit, Users, BookUser, CircleDollarSign, MoreVertical, Plane, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/shadcn/card';
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
        total: number;
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
  const [totalReports, setTotalReports] = useState(initialData?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [selectedReportForTravelers, setSelectedReportForTravelers] = useState<Report | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  
  const endpoint = searchTerm 
      ? `/api/reports?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=10`
      : `/api/reports?page=${page}&limit=10`;
  // Reset to first page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const { data, error, isLoading } = useSWR(endpoint, fetcher, {
    fallbackData: page === 1 ? initialData : undefined,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data) {
      setReports(data.reports);
      setTotalReports(data.total);
      setHasMore(data.hasMore);
    }
  }, [data]);

  const filteredReports = useMemo(() => {
    return reports;
  }, [reports]);

  const totalPages = Math.ceil(totalReports / 10);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

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

  const handleAssignAirportPickupClick = (groupId: string) => {
    router.push(`/airport-pickup-assignment/${groupId}`);
  };

  const handleViewTravelers = (report: Report) => {
    setSelectedReportForTravelers(report);
    setIsTravelerModalOpen(true);
  }

  const handleManagePayments = (groupId: string) => {
    router.push(`/payments/${groupId}`);
  }

  const handleExtraServices = (groupId: string) => {
    router.push(`/extra-services?groupId=${groupId}`);
  }

  const cardTitle = pageType === 'payments' ? 'Payment Status' : 'All Reports';
  const cardDescription = pageType === 'payments' 
    ? 'View and manage payment status for all reports.'
    : 'View and edit your saved cost estimation reports.';

  const renderMobileCards = () => (
    <div className="space-y-4 lg:hidden">
      {filteredReports.map((report) => {
        const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
        return (
          <Card key={report.groupId} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <CardTitle className="text-xl truncate">{report.trekName}</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                      {report.groupName}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                    <DropdownMenuItem onClick={() => handleAssignAirportPickupClick(report.groupId)} disabled={isAssignmentDisabled}>
                      <Plane className="mr-2 h-4 w-4" /> Assign Airport Pickup
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(report.groupId)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Costing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExtraServices(report.groupId)}>
                      <PlusSquare className="mr-2 h-4 w-4" /> Extra Services
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
                <span className="text-muted-foreground">Group ID</span>
                <div className="flex items-center gap-1">
                  <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-xs truncate max-w-[80px]" title={report.groupId}>
                    {report.groupId.substring(0, 8)}...
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                    {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span className="truncate max-w-[120px]">{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="border rounded-lg hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Trek Name</TableHead>
            <TableHead className="min-w-[120px]">Group Name</TableHead>
            <TableHead className="min-w-[120px]">Group ID</TableHead>
            <TableHead className="text-right min-w-[120px]">Total Cost</TableHead>
            <TableHead className="min-w-[130px]">Payment Status</TableHead>
            <TableHead className="text-right min-w-[120px]">Balance</TableHead>
            <TableHead className="text-center min-w-[100px]">Joined/Total</TableHead>
            <TableHead className="min-w-[120px]">Start Date</TableHead>
            <TableHead className="text-right min-w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map((report) => {
            const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
            return (
              <TableRow key={report.groupId}>
                <TableCell className="font-medium max-w-[200px] truncate">{report.trekName}</TableCell>
                <TableCell className="max-w-[150px] truncate">{report.groupName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-sm truncate max-w-[80px]" title={report.groupId}>
                      {report.groupId.substring(0, 8)}...
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.reportUrl)}>
                      {copiedId === report.reportUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy Report URL</span>
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-right">{formatCurrency(report.paymentDetails.totalCost)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize", statusColors[report.paymentDetails.paymentStatus])}>
                    {report.paymentDetails.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className={cn("font-medium text-right", report.paymentDetails.balance > 0 ? 'text-red-600' : 'text-green-600')}>
                  {formatCurrency(report.paymentDetails.balance)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-green-600 font-medium">{report.joined}</span>
                  <span className="text-muted-foreground"> / {report.groupSize}</span>
                </TableCell>
                <TableCell className="truncate max-w-[120px]">{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleManagePayments(report.groupId)} className="hidden xl:flex">
                      <CircleDollarSign className="mr-2 h-4 w-4" /> Manage
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManagePayments(report.groupId)} className="xl:hidden">
                          <CircleDollarSign className="mr-2 h-4 w-4" /> Manage Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTravelers(report)}>
                          <Users className="mr-2 h-4 w-4" /> View Travelers
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignClick(report.groupId)} disabled={isAssignmentDisabled}>
                          <BookUser className="mr-2 h-4 w-4" /> Assign Team
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignAirportPickupClick(report.groupId)} disabled={isAssignmentDisabled}>
                          <Plane className="mr-2 h-4 w-4" /> Assign Airport Pickup
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(report.groupId)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Costing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExtraServices(report.groupId)}>
                          <PlusSquare className="mr-2 h-4 w-4" /> Extra Services
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
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
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{cardTitle}</h1>
                <p className="text-muted-foreground text-sm">{cardDescription}</p>
            </div>
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search reports..."
                    className="w-full md:w-[250px] lg:w-[300px] pl-9 pr-4 py-2"
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
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalReports)} of {totalReports} reports
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-3 sm:px-4"
                    >
                        Previous
                    </Button>
                    
                    {/* Page numbers - responsive for mobile */}
                    <div className="flex space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                              <Button
                                  key={pageNum}
                                  variant={pageNum === page ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 sm:w-auto sm:h-auto text-xs sm:text-sm"
                                  onClick={() => handlePageChange(pageNum)}
                              >
                                  <span className="sm:hidden">{pageNum > 9 ? `${pageNum.toString().substring(0, 1)}...` : pageNum}</span>
                                  <span className="hidden sm:inline">{pageNum}</span>
                              </Button>
                          );
                      })}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasMore}
                        className="px-3 sm:px-4"
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </div>
    </>
  );
}

    
