"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Loader2, Save, PlusCircle, MinusCircle, Wallet, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/shadcn/form";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";
import type { Report, Transaction, PaymentDetails } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import useSWR from 'swr';
import { DatePicker } from '../ui/shadcn/date-picker';


interface PaymentPageContentProps {
    initialReport: Report;
}

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    type: z.enum(['payment', 'refund']),
    date: z.date({ required_error: "Transaction date is required." }),
    note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PaymentPageContent({ initialReport }: PaymentPageContentProps) {
    const { toast } = useToast();
    const router = useRouter();

    const { data: reportData, mutate: mutateReport } = useSWR(`/api/reports/${initialReport.groupId}`, fetcher, { fallbackData: initialReport });
    const { data: transactionData, mutate: mutateTransactions, error: swrError } = useSWR(`/api/transactions/${initialReport.groupId}`, fetcher);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            type: 'payment',
            date: new Date(),
            note: '',
        },
    });

    const transactionType = form.watch('type');

    const onSubmit = async (values: TransactionFormValues) => {
        if (!reportData) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/transactions/${reportData.groupId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save transaction');
            }
            toast({ title: 'Success', description: 'Transaction added successfully.' });
            form.reset({ amount: 0, type: 'payment', date: new Date(), note: '' });
            await mutateTransactions(); // Re-fetch transactions
            await mutateReport(); // Re-fetch report to update payment details
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isLoadingTransactions = !transactionData && !swrError;
    const transactions: Transaction[] = transactionData?.transactions || [];
    const paymentDetails: PaymentDetails | undefined = reportData?.paymentDetails;

    const isFullyPaid = paymentDetails?.paymentStatus === 'fully paid' || paymentDetails?.paymentStatus === 'overpaid';
    const isPaymentDisabled = isFullyPaid && transactionType === 'payment';

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Go back</span>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Payments</h1>
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
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Transaction Form */}
                <Card>
                    <CardHeader>
                         <h4 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5" /> Add New Transaction</h4>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ToggleGroup
                                                    type="single"
                                                    variant="outline"
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="w-full grid grid-cols-2"
                                                >
                                                    <ToggleGroupItem value="payment" className="gap-2 data-[state=on]:bg-green-100 dark:data-[state=on]:bg-green-900/50 dark:data-[state=on]:text-green-300 data-[state=on]:text-green-800">
                                                        <PlusCircle className="h-4 w-4" /> Payment
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem value="refund" className="gap-2 data-[state=on]:bg-red-100 dark:data-[state=on]:bg-red-900/50 dark:data-[state=on]:text-red-300 data-[state=on]:text-red-800">
                                                        <MinusCircle className="h-4 w-4" /> Refund
                                                    </ToggleGroupItem>
                                                </ToggleGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} disabled={isPaymentDisabled} /></FormControl>
                                        {isPaymentDisabled && <p className="text-sm text-yellow-600">This trip is fully paid. No more payments can be added.</p>}
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="note" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Note (Optional)</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting || isPaymentDisabled} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Save Transaction
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                     <CardHeader>
                        <h4 className="font-semibold text-lg">Transaction History</h4>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg max-h-[380px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTransactions ? (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : transactions.length > 0 ? (
                                        transactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{format(parseISO(t.date), 'PPP')}</TableCell>
                                                <TableCell className={cn("capitalize", t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>{t.type}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{t.note}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center h-24">No transactions yet.</TableCell></TableRow>
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
