"use client";

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Wallet, ArrowLeft, FileDown, Eye, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { useToast } from '@/hooks/use-toast';
import type { Report, Transaction, PaymentDetails, Trek, SectionState } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logoUrl } from '@/components/logo';
import { TransactionForm } from './transaction-form';
import { getAccessToken } from '@/lib/auth-utils';
import { handleExportPDF } from '@/lib/export';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";

// Define interface for payment detail API response
interface PaymentDetail {
    id: number;
    amount: number;
    payment_method: string;
    payment_types: string;
    remarks: string;
    date: string;
}

interface PaymentDetailResponse {
    total_amount: number;
    payments: PaymentDetail[];
    total_paid: number;
    total_refund: number;
    balance: number;
}

interface PaymentPageContentProps {
    initialReport: Report;
}

export function PaymentPageContent({ initialReport }: PaymentPageContentProps) {
    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedInvoice, setSelectedInvoice] = useState<Report | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // React Query hooks for fetching data
    const { data: reportData, isLoading: isLoadingReport, error: reportError } = useQuery<Report, Error>({
        queryKey: ['report', initialReport.groupId],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch(`/api/reports/${initialReport.groupId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch report');
            }
            return response.json();
        },
        initialData: initialReport,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    });

    // Fetch payment details from the new API endpoint
    const { data: paymentDetailData, isLoading: isLoadingPaymentDetails } = useQuery<PaymentDetailResponse, Error>({
        queryKey: ['paymentDetails', initialReport.groupId],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch(`/api/payment-details/${initialReport.groupId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch payment details');
            }
            return response.json();
        },
        staleTime: 1000 * 30, // 30 seconds - reduced from 2 minutes to ensure fresher data
        retry: 2
    });

    const { data: transactionData, isLoading: isLoadingTransactions, error: transactionError } = useQuery<{ transactions: Transaction[] }, Error>({
        queryKey: ['transactions', initialReport.groupId],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch(`/api/transactions/${initialReport.groupId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            return response.json();
        },
        staleTime: 1000 * 30, // 30 seconds - reduced from 2 minutes to ensure fresher data
        retry: 2
    });

    // Fetch all reports and transactions for merge calculations
    const { data: allReportsData } = useQuery<{ reports: Report[] }, Error>({
        queryKey: ['allReports'],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch('/api/reports?limit=1000', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch all reports');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: 2
    });

    const { data: allTransactionsData } = useQuery<{ transactions: Transaction[] }, Error>({
        queryKey: ['allTransactions'],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch('/api/transactions/all?all=true', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch all transactions');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: 2
    });

    const { data: extraInvoices, isLoading: isLoadingExtraInvoices } = useQuery<Report[], Error>({
        queryKey: ['extraInvoices', initialReport.groupId],
        queryFn: async () => {
            const token = getAccessToken();
            const response = await fetch(`/api/extra-invoices/${initialReport.groupId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch extra invoices');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 5,
        retry: 2
    });

    const calculateSectionTotals = (section: SectionState) => {
        const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
        const discountAmount = section.discountType === 'percentage'
            ? (subtotal * (section.discountValue / 100))
            : section.discountValue;
        const total = subtotal - discountAmount;
        return { subtotal, total, discountAmount };
    };

    // Calculate total amount from merged groups
    const calculateMergedGroupsTotal = (mergeGroups: string[] | undefined): number => {
        if (!mergeGroups || mergeGroups.length === 0 || !allTransactionsData) {
            return 0;
        }

        // Get all transactions for the merged groups
        const mergedGroupTransactions = allTransactionsData.transactions.filter(
            (t: Transaction) => mergeGroups.includes(t.groupId)
        );

        // Sum up all payment amounts (exclude refunds)
        return mergedGroupTransactions
            .filter((t: Transaction) => t.type === 'payment')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    };

    // Use payment details from the new API if available, otherwise fallback to report data
    const paymentDetails: (PaymentDetails & { totalRefund: number }) | undefined = paymentDetailData ? {
        totalCost: paymentDetailData.total_amount,
        totalPaid: paymentDetailData.total_paid,
        totalRefund: paymentDetailData.total_refund || 0,
        balance: paymentDetailData.balance, // Use balance directly from API
        paymentStatus: (() => {
            const epsilon = 0.01; // Tolerance for floating point inaccuracies

            if (paymentDetailData.total_paid === 0) return 'unpaid';
            if (Math.abs(paymentDetailData.balance) <= epsilon || paymentDetailData.balance < 0) {
                return paymentDetailData.total_paid > paymentDetailData.total_amount ? 'overpaid' : 'fully paid';
            }
            return 'partially paid';
        })()
    } : (reportData?.paymentDetails ? { ...reportData.paymentDetails, totalRefund: 0 } : undefined);

    const transactions: Transaction[] = paymentDetailData
        ? paymentDetailData.payments.map(payment => ({
            id: payment.id.toString(),
            groupId: initialReport.groupId,
            amount: payment.amount,
            type: payment.payment_types === 'pay' ? 'payment' : 'refund',
            date: payment.date,
            note: payment.remarks,
            paymentMethod: payment.payment_method // Map payment method
        }))
        : transactionData?.transactions || [];

    const isFullyPaid = paymentDetails?.paymentStatus === 'fully paid' || paymentDetails?.paymentStatus === 'overpaid';
    const isPaymentDisabled = isFullyPaid;

    const handleDownloadInvoice = async (transaction?: Transaction) => {
        if (!reportData || !paymentDetails) return;

        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        doc.setFont("helvetica");

        const pageLeftMargin = 15;
        const pageRightMargin = 15;
        const brandColor: [number, number, number] = [21, 29, 79]; // #151D4F
        let yPos = 20;

        // --- Header ---
        const logoWidth = 50;
        const logoHeight = (logoWidth * 54) / 256;

        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });

        doc.addImage(dataUrl as string, 'PNG', pageLeftMargin, yPos - 12, logoWidth, logoHeight);

        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...brandColor);
        doc.text("INVOICE", doc.internal.pageSize.width - pageRightMargin, yPos, { align: 'right' });

        yPos += 15;

        doc.setDrawColor(200);
        doc.line(pageLeftMargin, yPos, doc.internal.pageSize.width - pageRightMargin, yPos);
        yPos += 15;

        // --- Bill To & Info ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("BILL TO", pageLeftMargin, yPos);
        doc.text("INVOICE #", 120, yPos);
        doc.text("DATE", 160, yPos);

        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(reportData.groupName, pageLeftMargin, yPos);
        doc.text(reportData.groupId.substring(0, 13).toUpperCase(), 120, yPos);
        doc.text(format(new Date(), 'PPP'), 160, yPos);

        yPos += 5;
        doc.text(reportData.trekName, pageLeftMargin, yPos);
        yPos += 15;

        // --- Summary ---
        autoTable(doc, {
            startY: yPos,
            body: [
                ['Total Cost:', formatCurrency(paymentDetails.totalCost)],
                ['Total Paid:', formatCurrency(paymentDetails.totalPaid)],
                ['Balance Due:', formatCurrency(paymentDetails.balance)],
            ],
            theme: 'plain',
            styles: { fontSize: 12, font: 'helvetica' },
            columnStyles: {
                0: { fontStyle: 'bold', halign: 'right' },
                1: { fontStyle: 'bold', halign: 'right' }
            },
            tableWidth: 'wrap',
            margin: { left: doc.internal.pageSize.width - 85 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;


        // --- Transactions Table ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Transaction History", pageLeftMargin, yPos);
        yPos += 8;

        // If downloading individual transaction, only show that one
        const transactionsToShow = transaction ? [transaction] : transactions;
        const tableTitle = transaction ? "Transaction Details" : "Transaction History";

        if (transaction) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(tableTitle, pageLeftMargin, yPos);
            yPos += 8;

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Type', 'Note', 'Amount']],
                body: [[
                    format(parseISO(transaction.date), 'PPP'),
                    transaction.note && transaction.note.includes('Balance Due') ? 'Unpaid' : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
                    transaction.note || '-',
                    formatCurrency(transaction.amount)
                ]],
                theme: 'striped',
                headStyles: { fillColor: brandColor, font: 'helvetica' },
                styles: { font: 'helvetica' },
                columnStyles: {
                    3: { halign: 'right' }
                }
            });
        } else {
            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Type', 'Note', 'Amount']],
                body: transactions.map(t => [
                    format(parseISO(t.date), 'PPP'),
                    t.note && t.note.includes('Balance Due') ? 'Unpaid' : t.type.charAt(0).toUpperCase() + t.type.slice(1),
                    t.note || '-',
                    formatCurrency(t.amount)
                ]),
                theme: 'striped',
                headStyles: { fillColor: brandColor, font: 'helvetica' },
                styles: { font: 'helvetica' },
                columnStyles: {
                    3: { halign: 'right' }
                }
            });
        }

        // --- Footer ---
        const finalY = (doc as any).lastAutoTable.finalY;
        const pageHeight = doc.internal.pageSize.height;
        let footerY = pageHeight - 20;

        // If table is too long, put footer on next page
        if (finalY > footerY - 20) {
            doc.addPage();
            footerY = pageHeight - 20;
        } else {
            footerY = finalY + 30 > footerY ? pageHeight - 20 : finalY + 30;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, footerY, { align: 'center' });


        // If downloading individual transaction, name the file with transaction ID
        const filename = transaction
            ? `invoice-${reportData.groupId.substring(0, 8)}-${transaction.id.substring(0, 8)}.pdf`
            : `invoice-${reportData.groupId.substring(0, 8)}.pdf`;
        doc.save(filename);
    };

    const handleDownloadExtraInvoice = async (extraInvoice: Report) => {
        try {
            const selectedTrek: Trek = {
                id: extraInvoice.trekId,
                name: extraInvoice.trekName,
                description: '',
                times: 1,
                permits: []
            };
            const reportForExport = {
                ...extraInvoice,
                startDate: extraInvoice.startDate ? new Date(extraInvoice.startDate) : undefined
            };

            await handleExportPDF({
                selectedTrek,
                report: reportForExport as any,
                calculateSectionTotals,
                userName: 'Staff',
                includeServiceCharge: true
            });

            toast({ title: "Success", description: "Extra invoice has been exported." });
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: "Could not export extra invoice." });
        }
    };

    const handleViewInvoice = (invoice: Report) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleEditInvoice = (invoice: Report) => {
        router.push(`/cost-matrix/${invoice.groupId}?parentId=${initialReport.groupId}&isExtra=true`);
    };

    const renderBreakdownTable = (section: SectionState) => {
        if (!section.rows || section.rows.length === 0) return null;
        const { subtotal, total, discountAmount } = calculateSectionTotals(section);

        return (
            <div className="mb-6">
                <h5 className="font-semibold text-sm mb-2 text-primary">{section.name}</h5>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="h-8 text-xs">Description</TableHead>
                            <TableHead className="h-8 text-xs text-right">Rate</TableHead>
                            <TableHead className="h-8 text-xs text-right">No</TableHead>
                            <TableHead className="h-8 text-xs text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {section.rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="py-2 text-sm">{row.description}</TableCell>
                                <TableCell className="py-2 text-sm text-right">{formatCurrency(row.rate)}</TableCell>
                                <TableCell className="py-2 text-sm text-right">{row.no}</TableCell>
                                <TableCell className="py-2 text-sm text-right">{formatCurrency(row.total)}</TableCell>
                            </TableRow>
                        ))}
                        {section.discountValue > 0 && (
                            <TableRow className="border-t-2">
                                <TableCell colSpan={3} className="py-1 text-xs text-right text-muted-foreground">
                                    {section.discountType === 'percentage' ? `Discount (${section.discountValue}%)` : 'Discount'}
                                </TableCell>
                                <TableCell className="py-1 text-xs text-right text-red-600">
                                    -{formatCurrency(discountAmount)}
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow className="font-semibold">
                            <TableCell colSpan={3} className="py-2 text-sm text-right">Section Total</TableCell>
                            <TableCell className="py-2 text-sm text-right">{formatCurrency(total)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    };

    // Handle successful transaction submission
    const handleTransactionSuccess = () => {
        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['transactions', initialReport.groupId] });
        queryClient.invalidateQueries({ queryKey: ['report', initialReport.groupId] });
        queryClient.invalidateQueries({ queryKey: ['paymentDetails', initialReport.groupId] });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Go back</span>
                </Button>
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Manage Payments</h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-full truncate">
                        For Trek: <span className="font-medium text-primary">{reportData?.trekName}</span> | Group: <span className="font-medium text-primary">{reportData?.groupName}</span>
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {(isLoadingPaymentDetails || isLoadingReport) ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border rounded-lg p-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Cost</p>
                                    <p className="text-2xl font-bold">{formatCurrency(paymentDetails?.totalCost ?? 0)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(paymentDetails?.totalPaid ?? 0)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Refund</p>
                                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(paymentDetails?.totalRefund ?? 0)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Balance Due</p>
                                    <p className={cn("text-2xl font-bold", (paymentDetails?.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600')}>
                                        {formatCurrency(paymentDetails?.balance ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Payment Progress</span>
                                    <span className="font-medium">{Math.min(100, Math.max(0, Math.round((((paymentDetails?.totalPaid ?? 0) - (paymentDetails?.totalRefund ?? 0)) / (paymentDetails?.totalCost || 1)) * 100)))}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-600 transition-all duration-500 ease-in-out"
                                        style={{ width: `${Math.min(100, Math.max(0, (((paymentDetails?.totalPaid ?? 0) - (paymentDetails?.totalRefund ?? 0)) / (paymentDetails?.totalCost || 1)) * 100))}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Add Transaction Form */}
                    <Card className="h-full">
                        <CardHeader>
                            <h4 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5" /> Add New Transaction</h4>
                        </CardHeader>
                        <CardContent>
                            <TransactionForm
                                groupId={reportData.groupId}
                                onSuccess={handleTransactionSuccess}
                                isPaymentDisabled={isPaymentDisabled}
                            />
                        </CardContent>
                    </Card>

                    {/* Extra Invoices Section */}
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <h4 className="font-semibold text-lg">Extra Invoices / Additional Services</h4>
                                <CardDescription>Breakdown of additional services</CardDescription>
                            </div>
                            {/* <Button size="sm" asChild>
                                <Link href={`/cost-matrix/new?parentId=${initialReport.groupId}&isExtra=true`}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Service
                                </Link>
                            </Button> */}
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingExtraInvoices ? (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                        ) : extraInvoices && extraInvoices.length > 0 ? (
                                            extraInvoices.map(invoice => (
                                                <TableRow key={invoice.groupId}>
                                                    <TableCell className="max-w-[150px] truncate">
                                                        Additional Service
                                                    </TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(invoice.paymentDetails.totalCost)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)} className="h-8 w-8 p-0" title="View Details">
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="outline" size="sm" asChild className="h-8 w-8 p-0" title="Edit">
                                                                <Link href={`/cost-matrix/${invoice.groupId}?parentId=${initialReport.groupId}&isExtra=true`}>
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Link>
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleDownloadExtraInvoice(invoice)} className="h-8 w-8 p-0" title="Download PDF">
                                                                <FileDown className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No extra invoices found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <h4 className="font-semibold text-lg">Transaction History</h4>
                        <CardDescription>Payment and refund records for this group</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg max-h-[400px] overflow-y-auto overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTransactions ? (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : transactions.length > 0 ? (
                                        transactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell className="whitespace-nowrap">{format(parseISO(t.date), 'PPP')}</TableCell>
                                                <TableCell className={cn("capitalize font-medium",
                                                    t.note && t.note.includes('Balance Due') ? 'text-yellow-600' :
                                                        t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                                                    {t.note && t.note.includes('Balance Due') ? 'Unpaid' : t.type}
                                                </TableCell>
                                                <TableCell className="capitalize text-sm">{t.paymentMethod || 'N/A'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={t.note}>{t.note}</TableCell>
                                                <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(t.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(t)} className="h-8 w-8 p-0">
                                                        <FileDown className="h-4 w-4" />
                                                        <span className="sr-only">Download</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No transactions yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* View Extra Invoice Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center justify-between">
                            <span>Extra Invoice Details</span>
                            {selectedInvoice && (
                                <Badge variant={selectedInvoice.paymentDetails.balance === 0 ? "default" : "secondary"}>
                                    {selectedInvoice.paymentDetails.balance === 0 ? "Paid" : "Pending"}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            #{selectedInvoice?.groupId.substring(0, 8).toUpperCase()} - {selectedInvoice?.trekName}
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                        {selectedInvoice && (
                            <div className="space-y-4">
                                {renderBreakdownTable(selectedInvoice.permits)}
                                {renderBreakdownTable(selectedInvoice.services)}
                                {renderBreakdownTable(selectedInvoice.extraDetails)}

                                <div className="bg-muted/30 p-4 rounded-lg">
                                    <h5 className="font-semibold text-sm mb-3">Invoice Summary</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatCurrency(selectedInvoice.paymentDetails.totalCost / (1 + selectedInvoice.serviceCharge / 100))}</span>
                                        </div>
                                        {selectedInvoice.serviceCharge > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Service Charge ({selectedInvoice.serviceCharge}%)</span>
                                                <span>{formatCurrency(selectedInvoice.paymentDetails.totalCost - (selectedInvoice.paymentDetails.totalCost / (1 + selectedInvoice.serviceCharge / 100)))}</span>
                                            </div>
                                        )}
                                        <Separator className="my-1" />
                                        <div className="flex justify-between font-bold text-base">
                                            <span>Grand Total</span>
                                            <span className="text-primary">{formatCurrency(selectedInvoice.paymentDetails.totalCost)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2">
                                            <span className="text-green-600 font-medium">Total Paid</span>
                                            <span className="text-green-600 font-medium">{formatCurrency(selectedInvoice.paymentDetails.totalPaid)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className={cn("font-bold", selectedInvoice.paymentDetails.balance > 0 ? "text-red-600" : "text-green-600")}>
                                                Balance Due
                                            </span>
                                            <span className={cn("font-bold", selectedInvoice.paymentDetails.balance > 0 ? "text-red-600" : "text-green-600")}>
                                                {formatCurrency(selectedInvoice.paymentDetails.balance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                        <Button onClick={() => selectedInvoice && handleDownloadExtraInvoice(selectedInvoice)}>
                            <FileDown className="h-4 w-4 mr-2" /> Download PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}