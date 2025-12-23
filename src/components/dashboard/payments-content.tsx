"use client";

import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Copy, Check, Edit, Users, BookUser, CircleDollarSign, MoreVertical, Plane, PlusSquare, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";
import { Calendar } from "@/components/ui/shadcn/calendar";
import type { Report, PaymentStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";

const TravelerDetailsModal = lazy(() => import('@/components/dashboard/traveler-details-modal'));
import { QuickTransactionModal } from '@/components/dashboard/quick-transaction-modal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/shadcn/select";

interface PaymentsContentProps {
    initialData?: {
        reports: Report[];
        total: number;
        hasMore: boolean;
    };
}

const statusColors: Record<PaymentStatus, string> = {
    'unpaid': "text-red-600 border-red-600/50 bg-red-500/5",
    'partially paid': "text-yellow-600 border-yellow-600/50 bg-yellow-500/5",
    'fully paid': "text-green-600 border-green-600/50 bg-green-500/5",
    'overpaid': "text-purple-600 border-purple-600/50 bg-purple-500/5"
};

export function PaymentsContent({ initialData }: PaymentsContentProps) {
    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [reports, setReports] = useState<Report[]>(initialData?.reports || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalReports, setTotalReports] = useState(initialData?.total ?? 0);
    const [hasMore, setHasMore] = useState(initialData?.hasMore ?? true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [selectedReportForTravelers, setSelectedReportForTravelers] = useState<Report | null>(null);
    const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);

    const [selectedReportForPayment, setSelectedReportForPayment] = useState<Report | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [creatorFilter, setCreatorFilter] = useState<string>('all');
    const [date, setDate] = useState<DateRange | undefined>(undefined);

    // Reset to first page when search term changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    // Build query parameters
    const queryParams = useMemo(() => {
        const params = new URLSearchParams({
            page: String(page),
            limit: '10'
        });
        
        if (searchTerm) {
            params.set('search', searchTerm);
        }
        
        return params.toString();
    }, [page, searchTerm]);

    // Use React Query for fetching reports data
    const { data, error, isLoading, isFetching } = useQuery({
        queryKey: ['reports', { page, searchTerm }],
        queryFn: async () => {
            const response = await fetch(`/api/reports?${queryParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            return response.json();
        },
        placeholderData: (prevData) => prevData,
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: 2
    });

    useEffect(() => {
        if (data) {
            setReports(data.reports);
            setTotalReports(data.total);
            setHasMore(data.hasMore);
        }
    }, [data]);

    const uniqueCreators = useMemo(() => {
        const creators = new Set(reports.map(r => r.createdBy).filter(Boolean));
        return Array.from(creators).sort();
    }, [reports]);

    const filteredReports = useMemo(() => {
        let filtered = reports;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.paymentDetails.paymentStatus === statusFilter);
        }

        if (creatorFilter !== 'all') {
            filtered = filtered.filter(report => report.createdBy === creatorFilter);
        }

        if (date?.from) {
            filtered = filtered.filter(report => {
                if (!report.startDate) return false;
                const reportDate = new Date(report.startDate);
                if (date.to) {
                    return reportDate >= date.from! && reportDate <= date.to;
                }
                return reportDate >= date.from!;
            });
        }

        return filtered;
    }, [reports, statusFilter, creatorFilter, date]);

    // Calculate financial summary
    const financialSummary = useMemo(() => {
        const totalRevenue = filteredReports.reduce((sum, r) => sum + r.paymentDetails.totalCost, 0);
        const totalCollected = filteredReports.reduce((sum, r) => sum + r.paymentDetails.totalPaid, 0);
        const totalOutstanding = filteredReports.reduce((sum, r) => sum + r.paymentDetails.balance, 0);
        const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalCollected,
            totalOutstanding,
            collectionRate
        };
    }, [filteredReports]);

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

    const handleQuickPay = (report: Report) => {
        setSelectedReportForPayment(report);
        setIsPaymentModalOpen(true);
    };

    const handleTransactionSuccess = () => {
        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    const renderMobileCards = () => (
        <div className="space-y-4 lg:hidden">
            {filteredReports.map((report) => {
                const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
                return (
                    <Card key={report.groupId} className="w-full">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-xl truncate">{report.trekName}</CardTitle>
                                    <div className="text-sm text-muted-foreground mt-1 truncate">
                                        {report.groupName}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Cost</span>
                                <span className="font-medium">{formatCurrency(report.paymentDetails.totalCost)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium text-green-600">{formatCurrency(report.paymentDetails.totalPaid)}</span>
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
                            <div className="flex gap-2 pt-2">
                                <Button variant="default" size="sm" onClick={() => handleQuickPay(report)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                    <PlusSquare className="h-3.5 w-3.5 mr-1" /> Quick Pay
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleManagePayments(report.groupId)} className="flex-1">
                                    <Wallet className="h-3.5 w-3.5 mr-1" /> Manage
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );

    const renderDesktopTable = () => (
        <div className="hidden lg:block w-full overflow-x-auto">
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px] min-w-[140px] max-w-[200px]">Trek Name</TableHead>
                        <TableHead className="w-[120px] min-w-[90px] max-w-[150px]">Group</TableHead>
                        <TableHead className="text-right w-[100px] min-w-[80px]">Total Cost</TableHead>
                        <TableHead className="text-right w-[100px] min-w-[80px]">Paid</TableHead>
                        <TableHead className="text-right w-[100px] min-w-[80px]">Balance</TableHead>
                        <TableHead className="w-[110px] min-w-[90px]">Status</TableHead>
                        <TableHead className="text-center w-[90px] min-w-[70px]">Travelers</TableHead>
                        <TableHead className="w-[110px] min-w-[90px]">Start Date</TableHead>
                        <TableHead className="text-right w-[180px] min-w-[150px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredReports.map((report) => {
                        const isAssignmentDisabled = report.paymentDetails.paymentStatus === 'unpaid';
                        return (
                            <TableRow key={report.groupId}>
                                <TableCell className="font-medium truncate" title={report.trekName}>
                                    <div className="max-w-[180px] truncate">{report.trekName}</div>
                                </TableCell>
                                <TableCell className="truncate" title={report.groupName}>
                                    <div className="max-w-[120px] truncate">{report.groupName}</div>
                                </TableCell>
                                <TableCell className="font-medium text-right text-sm">{formatCurrency(report.paymentDetails.totalCost)}</TableCell>
                                <TableCell className="font-medium text-right text-sm text-green-600">{formatCurrency(report.paymentDetails.totalPaid)}</TableCell>
                                <TableCell className={cn("font-medium text-right text-sm", report.paymentDetails.balance > 0 ? 'text-red-600' : 'text-green-600')}>
                                    {formatCurrency(report.paymentDetails.balance)}
                                </TableCell>
                                <TableCell className="w-[120px]">
                                    <Badge variant="outline" className={cn("capitalize text-xs w-full justify-center", statusColors[report.paymentDetails.paymentStatus])}>
                                        {report.paymentDetails.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                    <span className="text-green-600 font-medium">{report.joined}</span>
                                    <span className="text-muted-foreground">/{report.groupSize}</span>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {report.startDate ? format(new Date(report.startDate), 'MMM d, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right w-[180px]">
                                    <div className="flex justify-end items-center gap-2">
                                        <Button variant="default" size="sm" onClick={() => handleQuickPay(report)} className="h-8 bg-green-600 hover:bg-green-700 text-white border-green-600">
                                            <PlusSquare className="h-3.5 w-3.5 mr-1" /> <span>Pay</span>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleManagePayments(report.groupId)} className="h-8">
                                            <Wallet className="h-3.5 w-3.5 mr-1" /> <span>Manage</span>
                                        </Button>
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
                {isTravelerModalOpen && (
                    <TravelerDetailsModal
                        isOpen={isTravelerModalOpen}
                        onClose={() => setIsTravelerModalOpen(false)}
                        report={selectedReportForTravelers}
                    />
                )}
                {isPaymentModalOpen && (
                    <QuickTransactionModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        report={selectedReportForPayment}
                        onSuccess={handleTransactionSuccess}
                    />
                )}
            </Suspense>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
                    <p className="text-muted-foreground text-sm">Track and manage payments for all trek quotations.</p>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">From {filteredReports.length} quotation{filteredReports.length !== 1 ? 's' : ''}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalCollected)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{financialSummary.collectionRate.toFixed(1)}% collection rate</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalOutstanding)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pending collection</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Collection Progress</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{financialSummary.collectionRate.toFixed(0)}%</div>
                            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-600 transition-all duration-500"
                                    style={{ width: `${Math.min(100, financialSummary.collectionRate)}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex flex-col sm:flex-row gap-2 flex-1">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="partially paid">Partially Paid</SelectItem>
                                        <SelectItem value="fully paid">Fully Paid</SelectItem>
                                        <SelectItem value="overpaid">Overpaid</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter Creator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Creators</SelectItem>
                                        {uniqueCreators.map(creator => (
                                            <SelectItem key={creator as string} value={creator as string}>
                                                {creator}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full sm:w-[260px] justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <>
                                                        {format(date.from, "LLL dd, y")} -{" "}
                                                        {format(date.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(date.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="relative w-full lg:w-[300px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search quotations..."
                                    className="pl-9 pr-4 py-2"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
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
                                        <p>No payments found.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>

                    {/* Pagination Footer */}
                    {filteredReports.length > 0 && (
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-0 pb-6">
                            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalReports)} of {totalReports} quotations
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
                        </CardContent>
                    )}
                </Card>
            </div>
        </>
    );
}
