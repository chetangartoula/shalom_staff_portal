"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, PlusCircle, MinusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/shadcn/form";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";
import { DatePicker } from '../ui/shadcn/date-picker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { Badge } from "@/components/ui/shadcn/badge";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { cn } from '@/lib/utils';
import type { Report, Transaction } from '@/lib/types';
import useSWR from 'swr';

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    type: z.enum(['payment', 'refund']),
    date: z.date({ required_error: "Transaction date is required." }),
    note: z.string().optional(),
    mergeGroups: z.array(z.string()).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
    groupId: string;
    onSuccess?: () => void;
    initialData?: Partial<TransactionFormValues>;
    isPaymentDisabled?: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TransactionForm({ groupId, onSuccess, initialData, isPaymentDisabled = false }: TransactionFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReports, setSelectedReports] = useState<{ groupId: string, groupName: string }[]>([]);

    const { data: allReportsData } = useSWR('/api/reports?limit=1000', fetcher);
    const { data: allTransactionsData } = useSWR('/api/transactions/all?all=true', fetcher);

    // Filter reports for merge selection (exclude current report)
    const availableReports = allReportsData?.reports?.filter((report: Report) =>
        report.groupId !== groupId &&
        (report.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.groupId.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const calculateMergedGroupsTotal = (mergeGroups: string[] | undefined): number => {
        if (!mergeGroups || mergeGroups.length === 0 || !allTransactionsData) {
            return 0;
        }

        const mergedGroupTransactions = allTransactionsData.transactions.filter(
            (t: Transaction) => mergeGroups.includes(t.groupId)
        );

        return mergedGroupTransactions
            .filter((t: Transaction) => t.type === 'payment')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    };

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: initialData?.amount || 0,
            type: initialData?.type || 'payment',
            date: initialData?.date || new Date(),
            note: initialData?.note || '',
            mergeGroups: initialData?.mergeGroups || [],
        },
    });

    // Update form when selected reports change
    useEffect(() => {
        const mergeGroups = selectedReports.map(r => r.groupId);
        form.setValue('mergeGroups', mergeGroups);

        const mergedTotal = calculateMergedGroupsTotal(mergeGroups);
        if (mergedTotal > 0 && mergeGroups.length > 0) {
            form.setValue('amount', mergedTotal);
        }
    }, [selectedReports]);

    const mergeGroupsValue = form.watch('mergeGroups');

    useEffect(() => {
        const mergedTotal = calculateMergedGroupsTotal(mergeGroupsValue);
        if (mergedTotal > 0 && mergeGroupsValue && mergeGroupsValue.length > 0) {
            form.setValue('amount', mergedTotal);
        }
    }, [mergeGroupsValue]);

    const onSubmit = async (values: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/transactions/${groupId}`, {
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
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
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
                )} />

                <FormField control={form.control} name="mergeGroups" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Merge Groups</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn("justify-between", !field.value && "text-muted-foreground")}
                                    >
                                        {selectedReports.length > 0
                                            ? `${selectedReports.length} group(s) selected`
                                            : "Select groups to merge..."}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search by group name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="mb-2"
                                    />
                                    <div className="max-h-60 overflow-y-auto">
                                        {availableReports.length > 0 ? (
                                            availableReports.map((report: Report) => (
                                                <div
                                                    key={report.groupId}
                                                    className="flex items-center space-x-2 py-2 px-1 hover:bg-accent rounded cursor-pointer"
                                                    onClick={() => {
                                                        const isSelected = selectedReports.some(r => r.groupId === report.groupId);
                                                        if (isSelected) {
                                                            setSelectedReports(selectedReports.filter(r => r.groupId !== report.groupId));
                                                        } else {
                                                            setSelectedReports([...selectedReports, { groupId: report.groupId, groupName: report.groupName }]);
                                                        }
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={selectedReports.some(r => r.groupId === report.groupId)}
                                                        className="mr-2"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{report.groupName}</span>
                                                        <span className="text-xs text-muted-foreground">{report.groupId}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                No groups found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {selectedReports.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedReports.map((report) => (
                                    <Badge
                                        key={report.groupId}
                                        variant="secondary"
                                        className="pr-1"
                                    >
                                        {report.groupName}
                                        <button
                                            type="button"
                                            className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedReports(selectedReports.filter(r => r.groupId !== report.groupId));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="note" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Note (Optional)</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting || isPaymentDisabled} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Transaction
                </Button>
            </form>
        </Form>
    );
}
