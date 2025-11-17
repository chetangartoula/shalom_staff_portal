
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Report {
    groupId: string;
    trekName: string;
    groupSize: number;
    joined: number;
    pending: number;
}

interface Traveler {
  id: string;
  name: string;
  phone: string;
  address: string;
  passportNumber: string;
  emergencyContact: string;
  dateOfBirth?: string;
  nationality?: string;
  passportExpiryDate?: string;
}

interface TravelerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
}

export default function TravelerDetailsModal({ isOpen, onClose, report }: TravelerDetailsModalProps) {
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && report) {
            const fetchTravelers = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/travelers/${report.groupId}`);
                    if (!response.ok) throw new Error("Failed to fetch traveler details.");
                    const data = await response.json();
                    setTravelers(data.travelers || []);
                } catch (error) {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: (error as Error).message,
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTravelers();
        }
    }, [isOpen, report, toast]);

    const handlePrintPdf = async () => {
        if (!report) return;
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Traveler Details for ${report.trekName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Group ID: ${report.groupId}`, 14, 30);

        const tableColumn = ["Name", "Nationality", "Passport No.", "Phone", "Emergency Contact"];
        const tableRows: (string | undefined)[][] = [];

        travelers.forEach(traveler => {
            const travelerData = [
                traveler.name,
                traveler.nationality,
                traveler.passportNumber,
                traveler.phone,
                traveler.emergencyContact,
            ];
            tableRows.push(travelerData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });

        doc.save(`travelers-${report.groupId.substring(0, 8)}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Traveler Details</DialogTitle>
                    <DialogDescription>
                        Details for group: <span className="font-medium text-primary">{report?.trekName}</span> (ID: {report?.groupId.substring(0, 8)}...)
                    </DialogDescription>
                    <div className="flex items-center gap-4 pt-2">
                        <Badge variant="outline">Group Size: <span className="font-bold ml-1">{report?.groupSize}</span></Badge>
                        <Badge variant="outline" className="text-green-600 border-green-600">Joined: <span className="font-bold ml-1">{report?.joined}</span></Badge>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Pending: <span className="font-bold ml-1">{report?.pending}</span></Badge>
                    </div>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Nationality</TableHead>
                                    <TableHead>Passport No.</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Emergency Contact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {travelers.length > 0 ? travelers.map((traveler) => (
                                    <TableRow key={traveler.id}>
                                        <TableCell className="font-medium">{traveler.name}</TableCell>
                                        <TableCell>{traveler.nationality || 'N/A'}</TableCell>
                                        <TableCell>{traveler.passportNumber}</TableCell>
                                        <TableCell>{traveler.phone}</TableCell>
                                        <TableCell>{traveler.emergencyContact}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No traveler details submitted for this group yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrintPdf} disabled={isLoading || travelers.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Print to PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
