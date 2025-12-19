"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMergePackages, updateMergePackages, makePayment, type APIPaymentRequest } from '@/lib/api-service';

// Define interface for merged package
interface MergedPackage {
  id: number;
  name: string;
}

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

export function TransactionForm({ groupId, onSuccess, initialData, isPaymentDisabled = false }: TransactionFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReports, setSelectedReports] = useState<{ groupId: string, groupName: string }[]>([]);

    // Fetch all reports for merge selection
    const { data: allReportsData, isLoading: isLoadingReports } = useQuery<{ reports: Report[] }, Error>({
        queryKey: ['allReports'],
        queryFn: async () => {
            const response = await fetch('/api/reports?limit=1000');
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: 2
    });

    // Fetch all transactions for merged group calculations
    const { data: allTransactionsData } = useQuery<{ transactions: Transaction[] }, Error>({
        queryKey: ['allTransactions'],
        queryFn: async () => {
            const response = await fetch('/api/transactions/all?all=true');
            if (!response.ok) {
                throw new Error('Failed to fetch all transactions');
            }
            return response.json();
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: 2
    });

    // Fetch current merge packages for this group
    const { data: mergePackagesData } = useQuery<MergedPackage[], Error>({
        queryKey: ['mergePackages', groupId],
        queryFn: async () => {
            try {
                return await fetchMergePackages(groupId);
            } catch (error) {
                console.error('Failed to fetch merge packages, using empty array:', error);
                return [];
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    });

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

    // Set initial selected reports based on merge packages data
    useEffect(() => {
        if (mergePackagesData && allReportsData?.reports) {
            // Convert merged package IDs to strings to match report IDs
            const mergedPackageIds = mergePackagesData.map(pkg => pkg.id.toString());
            
            const initialSelected = allReportsData.reports
                .filter(report => mergedPackageIds.includes(report.groupId))
                .map(report => ({ groupId: report.groupId, groupName: report.groupName }));
            setSelectedReports(initialSelected);
        }
    }, [mergePackagesData, allReportsData]);

    // Function to update merge packages in real-time
    const updateMergePackagesRealTime = useCallback(async (selectedGroupIds: string[]) => {
        try {
            const mergePackageIds = selectedGroupIds.map(id => parseInt(id)).filter(id => !isNaN(id));
            await updateMergePackages(groupId, mergePackageIds);
            
            // Invalidate and refetch merge packages to keep cache consistent
            queryClient.invalidateQueries({ queryKey: ['mergePackages', groupId] });
        } catch (error) {
            console.error('Failed to update merge packages:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'Failed to update merged groups. Please try again.' 
            });
        }
    }, [groupId, queryClient, toast]);

    // Handle selection/deselection of reports with real-time API update
    const handleReportSelection = async (report: { groupId: string, groupName: string }) => {
        const isSelected = selectedReports.some(r => r.groupId === report.groupId);
        let newSelectedReports;
        
        if (isSelected) {
            // Deselect report
            newSelectedReports = selectedReports.filter(r => r.groupId !== report.groupId);
        } else {
            // Select report
            newSelectedReports = [...selectedReports, report];
        }
        
        setSelectedReports(newSelectedReports);
        
        // Immediately update merge packages in the backend
        const selectedGroupIds = newSelectedReports.map(r => r.groupId);
        await updateMergePackagesRealTime(selectedGroupIds);
    };

    // Handle removal of a selected report with real-time API update
    const handleRemoveSelectedReport = async (reportGroupId: string) => {
        const newSelectedReports = selectedReports.filter(r => r.groupId !== reportGroupId);
        setSelectedReports(newSelectedReports);
        
        // Immediately update merge packages in the backend
        const selectedGroupIds = newSelectedReports.map(r => r.groupId);
        await updateMergePackagesRealTime(selectedGroupIds);
    };

    const onSubmit = async (values: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            // Prepare payment data for the new API endpoint
            const paymentData: APIPaymentRequest = {
                package_id: groupId,
                amount: values.amount,
                remarks: values.note || '',
                payment_type: values.type === 'payment' ? 'pay' : 'refund',
                date: values.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
            };

            // Make payment via the new API endpoint
            await makePayment(paymentData);

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
                                        {isLoadingReports ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                Loading groups...
                                            </div>
                                        ) : availableReports.length > 0 ? (
                                            availableReports.map((report: Report) => (
                                                <div
                                                    key={report.groupId}
                                                    className="flex items-center space-x-2 py-2 px-1 hover:bg-accent rounded cursor-pointer"
                                                    onClick={() => handleReportSelection({ groupId: report.groupId, groupName: report.groupName })}
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
                                                handleRemoveSelectedReport(report.groupId);
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