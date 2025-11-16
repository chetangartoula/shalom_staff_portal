
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface RecentReportsProps {
    reports: any[];
}

export function RecentReports({ reports }: RecentReportsProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
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
                        {reports.length > 0 ? reports.map((report: any) => (
                            <TableRow key={report.groupId}>
                                <TableCell className="font-medium">{report.trekName}</TableCell>
                                <TableCell>{report.groupId.substring(0, 8)}...</TableCell>
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
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No recent reports found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

RecentReports.Skeleton = function RecentReportsSkeleton() {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
}
