import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

async function getRecentReports() {
    // Using 'no-store' to ensure the latest reports are always fetched for the dashboard.
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports?page=1&limit=5`, { cache: 'no-store' });
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch recent reports');
    }
    return res.json();
}


export async function RecentReports() {
    const data = await getRecentReports();
    const recentReports = data.reports;

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
                        {recentReports.length > 0 ? recentReports.map((report: any) => (
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