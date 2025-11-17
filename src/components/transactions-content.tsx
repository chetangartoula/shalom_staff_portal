
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import useSWR from 'swr';
import { Search, Loader2, PlusCircle, MinusCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface TransactionWithContext extends Transaction {
    trekName: string;
    groupName: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TransactionsContent() {
  const { toast } = useToast();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionWithContext[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data, error, isLoading } = useSWR(`/api/transactions/all?page=${page}`, fetcher);

  useEffect(() => {
    if (data) {
        if (page === 1) {
            setTransactions(data.transactions);
        } else {
            setTransactions(prev => [...prev, ...data.transactions]);
        }
        setHasMore(data.hasMore);
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


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>View and search all financial transactions across all groups.</CardDescription>
            </div>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by trek, group, or note..."
                    className="w-full sm:w-[300px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && page === 1 ? (
           <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : (
          <div className="border rounded-lg">
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
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
        )}
      </CardContent>
       {hasMore && !searchTerm && (
        <CardFooter className="justify-center pt-6">
          <Button onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    