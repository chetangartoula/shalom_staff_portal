
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import useSWR from 'swr';
import { Search, Loader2, PlusCircle, MinusCircle, ArrowDown, ArrowUp, DollarSign, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { DateRangePicker } from './ui/date-range-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DateRange } from 'react-day-picker';

interface TransactionWithContext extends Transaction {
    trekName: string;
    groupName: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TransactionsContent() {
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<TransactionWithContext[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState({ totalPayments: 0, totalRefunds: 0, netTotal: 0 });

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<'all' | 'payment' | 'refund'>('all');

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: '10',
    type: typeFilter,
  });

  if (dateRange?.from) queryParams.set('from', dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set('to', dateRange.to.toISOString());

  const { data, error, isLoading, mutate } = useSWR(`/api/transactions/all?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true,
  });

  useEffect(() => {
    // Reset page to 1 whenever filters change
    setPage(1);
  }, [dateRange, typeFilter]);

  useEffect(() => {
    if (data) {
        if (page === 1) {
            setTransactions(data.transactions);
        } else {
            // Append new transactions if they don't already exist
            setTransactions(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const newTransactions = data.transactions.filter((t: Transaction) => !existingIds.has(t.id));
                return [...prev, ...newTransactions];
            });
        }
        setHasMore(data.hasMore);
        if (data.summary) {
            setSummary(data.summary);
        }
    }
  }, [data, page]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction =>
      (transaction.trekName && transaction.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.groupName && transaction.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.note && transaction.note.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, transactions]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);
  
  const renderDesktopTable = () => (
     <div className="border rounded-lg hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Trek Name</TableHead>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                    <TableCell>{format(parseISO(transaction.date), 'PPP')}</TableCell>
                    <TableCell className="font-medium">{transaction.trekName}</TableCell>
                    <TableCell>
                        <Link href={`/payments/${transaction.groupId}`} className="hover:underline">
                            <Badge variant="outline">{transaction.groupName}</Badge>
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant={transaction.type === 'payment' ? 'default' : 'destructive'} 
                            className={cn(
                                'capitalize', 
                                transaction.type === 'payment' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            )}
                        >
                            {transaction.type === 'payment' ? <PlusCircle className="mr-1 h-3 w-3" /> : <MinusCircle className="mr-1 h-3 w-3"/>}
                            {transaction.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">{transaction.note || '–'}</TableCell>
                    <TableCell className={cn("text-right font-bold", transaction.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                        {transaction.type === 'payment' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                    </TableCell>
                </TableRow>
                )) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No transactions found for the selected filters.
                    </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-4 md:hidden">
        {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-lg">{transaction.trekName}</CardTitle>
                             <CardDescription>
                                <Link href={`/payments/${transaction.groupId}`} className="hover:underline">
                                    <Badge variant="outline" className="mt-1">{transaction.groupName}</Badge>
                                </Link>
                             </CardDescription>
                        </div>
                         <div className={cn("text-lg font-bold", transaction.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                            {transaction.type === 'payment' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Type</span>
                         <Badge 
                            variant={transaction.type === 'payment' ? 'default' : 'destructive'} 
                            className={cn(
                                'capitalize', 
                                transaction.type === 'payment' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            )}
                        >
                            {transaction.type === 'payment' ? <PlusCircle className="mr-1 h-3 w-3" /> : <MinusCircle className="mr-1 h-3 w-3"/>}
                            {transaction.type}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{format(parseISO(transaction.date), 'PPP')}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Note</span>
                        <span className="text-muted-foreground italic">{transaction.note || '–'}</span>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );


  return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPayments)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalRefunds)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", summary.netTotal >= 0 ? "text-slate-700" : "text-red-600")}>
                        {formatCurrency(summary.netTotal)}
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>View and search all financial transactions across all groups.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full sm:w-auto justify-start">
                                <Filter className="h-4 w-4" />
                                <span>{typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1) + 's'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="payment">Payments</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="refund">Refunds</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-full sm:w-auto">
                      <DateRangePicker date={dateRange} setDate={setDateRange} />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search transactions..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : (
              <>
                {renderDesktopTable()}
                {renderMobileCards()}
                {filteredTransactions.length === 0 && !isLoading && (
                  <div className="text-center text-muted-foreground py-12">
                     <p>No transactions found for the selected filters.</p>
                  </div>
                )}
              </>
            )}
        </CardContent>
        {hasMore && !searchTerm && (
            <CardFooter className="justify-center pt-6">
            <Button onClick={handleLoadMore} disabled={isLoading}>
                {isLoading && page > 1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load More
            </Button>
            </CardFooter>
        )}
        </Card>
      </div>
  );
}

    