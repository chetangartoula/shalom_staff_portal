"use client";

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Wallet, ArrowLeft, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { useToast } from '@/hooks/use-toast';
import type { Report, Transaction, PaymentDetails } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import useSWR from 'swr';
import { logoUrl } from '@/components/logo';
import { TransactionForm } from './transaction-form';

interface PaymentPageContentProps {
    initialReport: Report;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PaymentPageContent({ initialReport }: PaymentPageContentProps) {
    const { toast } = useToast();
    const router = useRouter();

    const { data: reportData, mutate: mutateReport } = useSWR(`/api/reports/${initialReport.groupId}`, fetcher, { fallbackData: initialReport });
    const { data: transactionData, mutate: mutateTransactions, error: swrError } = useSWR(`/api/transactions/${initialReport.groupId}`, fetcher);
    const { data: allReportsData } = useSWR('/api/reports?limit=1000', fetcher); // Fetch all reports for merge selection
    const { data: allTransactionsData } = useSWR('/api/transactions/all?all=true', fetcher); // Fetch all transactions for merged group calculations

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

    const isLoadingTransactions = !transactionData && !swrError;
    const transactions: Transaction[] = transactionData?.transactions || [];
    const paymentDetails: PaymentDetails | undefined = reportData?.paymentDetails;

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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-lg p-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold">{formatCurrency(paymentDetails?.totalCost ?? 0)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(paymentDetails?.totalPaid ?? 0)}</p>
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
                            <span className="font-medium">{Math.min(100, Math.round(((paymentDetails?.totalPaid ?? 0) / (paymentDetails?.totalCost || 1)) * 100))}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-600 transition-all duration-500 ease-in-out"
                                style={{ width: `${Math.min(100, ((paymentDetails?.totalPaid ?? 0) / (paymentDetails?.totalCost || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Transaction Form */}
                <Card>
                    <CardHeader>
                        <h4 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5" /> Add New Transaction</h4>
                    </CardHeader>
                    <CardContent>
                        <TransactionForm
                            groupId={reportData.groupId}
                            onSuccess={() => {
                                mutateTransactions();
                                mutateReport();
                            }}
                            isPaymentDisabled={isPaymentDisabled}
                        />
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <h4 className="font-semibold text-lg">Transaction History</h4>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg max-h-[380px] overflow-y-auto overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTransactions ? (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : transactions.length > 0 ? (
                                        transactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{format(parseISO(t.date), 'PPP')}</TableCell>
                                                <TableCell className={cn("capitalize",
                                                    t.note && t.note.includes('Balance Due') ? 'text-yellow-600' :
                                                        t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                                                    {t.note && t.note.includes('Balance Due') ? 'Unpaid' : t.type}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{t.note}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(t)}>
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">No transactions yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
