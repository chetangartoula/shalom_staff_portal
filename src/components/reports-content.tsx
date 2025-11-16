
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Edit, Search, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Report {
    groupId: string;
    trekName: string;
    groupSize: number;
    startDate: string;
    reportUrl: string;
}

export function ReportsContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReports = useCallback(async (pageNum: number, initialLoad = false) => {
    if(initialLoad) setIsLoading(true);
    else setIsMoreLoading(true);

    try {
      const res = await fetch(`/api/reports?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      
      setReports(prev => pageNum === 1 ? data.reports : [...prev, ...data.reports]);
      setHasMore(data.hasMore);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load reports.',
      });
    } finally {
      if(initialLoad) setIsLoading(false);
      else setIsMoreLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchReports(1, true);
  }, [fetchReports]);

  useEffect(() => {
    const results = reports.filter(report =>
      (report.trekName && report.trekName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.groupId && report.groupId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredReports(results);
  }, [searchTerm, reports]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReports(nextPage);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
        title: "Copied!",
        description: "Group ID copied to clipboard.",
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (groupId: string) => {
    router.push(`/cost-matrix/${groupId}`);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Saved Reports</CardTitle>
                  <CardDescription>View and edit your saved cost estimation reports.</CardDescription>
              </div>
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by trek or group ID..."
                      className="w-full sm:w-[300px] pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Trek Name</TableHead>
                        <TableHead>Group ID</TableHead>
                        <TableHead>Group Size</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReports.length > 0 ? filteredReports.map((report) => (
                        <TableRow key={report.groupId}>
                            <TableCell className="font-medium">{report.trekName}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                  <Link href={report.reportUrl} target="_blank" className="text-blue-600 hover:underline font-mono text-sm" title={report.groupId}>
                                    {report.groupId.substring(0, 8)}...
                                  </Link>
                                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(report.groupId)}>
                                      {copiedId === report.groupId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      <span className="sr-only">Copy Group ID</span>
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>{report.groupSize}</TableCell>
                            <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(report.groupId)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No reports found.
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
            <Button onClick={handleLoadMore} disabled={isMoreLoading}>
              {isMoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
