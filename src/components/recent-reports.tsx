
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecentReportsProps {
    reports: any[];
}

export function RecentReports({ reports }: RecentReportsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>A quick look at the most recently created cost reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Trek Name</TableHead>
                                <TableHead>Group Name</TableHead>
                                <TableHead>Group ID</TableHead>
                                <TableHead>Group Size</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? reports.map((report: any) => (
                                <TableRow key={report.groupId}>
                                    <TableCell className="font-medium">{report.trekName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{report.groupName}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{report.groupId.substring(0, 8)}...</TableCell>
                                    <TableCell>{report.groupSize}</TableCell>
                                    <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/cost-matrix/${report.groupId}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No recent reports found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

RecentReports.Skeleton = function RecentReportsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>A quick look at the most recently created cost reports.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
}
