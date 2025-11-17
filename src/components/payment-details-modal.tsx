
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Loader2, Save, PlusCircle, MinusCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Report, Transaction } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import useSWR from 'swr';
import { DatePicker } from './ui/date-picker';


interface PaymentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
    onTransactionSave: (groupId: string) => void;
}

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    type: z.enum(['payment', 'refund']),
    date: z.date({ required_error: "Transaction date is required." }),
    note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PaymentDetailsModal({ isOpen, onClose, report, onTransactionSave }: PaymentDetailsModalProps) {
    const { toast } = useToast();
    const { data, mutate, error: swrError } = useSWR(report ? `/api/transactions/${report.groupId}` : null, fetcher);
    
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

    useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    const onSubmit = async (values: TransactionFormValues) => {
        if (!report) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/transactions/${report.groupId}`, {
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
            await mutate(); // Re-fetch transactions
            onTransactionSave(report.groupId); // Notify parent to refresh report data
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isLoading = !data && !swrError;
    const transactions: Transaction[] = data?.transactions || [];
    const paymentDetails = report?.paymentDetails;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Payments</DialogTitle>
                    <DialogDescription>
                        For Trek: <span className="font-medium text-primary">{report?.trekName}</span> | Group: <span className="font-medium text-primary">{report?.groupName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-4 my-4">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Transaction Form */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5" /> Add New Transaction</h4>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
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
                                                    <ToggleGroupItem value="payment" className="gap-2 data-[state=on]:bg-green-100 data-[state=on]:text-green-800">
                                                        <PlusCircle className="h-4 w-4" /> Payment
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem value="refund" className="gap-2 data-[state=on]:bg-red-100 data-[state=on]:text-red-800">
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
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Save Transaction
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Transaction History</h4>
                        <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : transactions.length > 0 ? (
                                        transactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{format(parseISO(t.date), 'PPP')}</TableCell>
                                                <TableCell className={cn("capitalize", t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>{t.type}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No transactions yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
