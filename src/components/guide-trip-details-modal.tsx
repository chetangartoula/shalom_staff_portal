
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, FileDown, User, Backpack, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Guide, Porter } from '@/lib/types';

interface Assignment {
    groupId: string;
    trekName: string;
    groupName: string;
    startDate: string;
}

interface TripDetails {
    report: {
        trekName: string;
        groupName: string;
        startDate: string;
        groupSize: number;
    };
    travelers: any[];
    guides: Guide[];
    porters: Porter[];
}

interface GuideTripDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

export default function GuideTripDetailsModal({ isOpen, onClose, assignment }: GuideTripDetailsModalProps) {
    const [details, setDetails] = useState<TripDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && assignment) {
            const fetchDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/assignments/details/${assignment.groupId}`);
                    if (!response.ok) throw new Error("Failed to fetch trip details.");
                    const data = await response.json();
                    setDetails(data);
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
            fetchDetails();
        }
    }, [isOpen, assignment, toast]);

    const handlePrintPdf = async () => {
        if (!assignment || !details) return;
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(`Trip Details: ${details.report.trekName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Group: ${details.report.groupName} | Start Date: ${format(new Date(details.report.startDate), 'PPP')}`, 14, 30);

        let yPos = 40;

        // Team Details
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Assigned Team", 14, yPos);
        yPos += 7;

        const guidesText = details.guides.map(g => `${g.name} (${g.phone})`).join(', ');
        const portersText = details.porters.map(p => `${p.name} (${p.phone})`).join(', ');

        autoTable(doc, {
            startY: yPos,
            body: [
                ['Guides', guidesText || 'None'],
                ['Porters', portersText || 'None'],
            ],
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        

        // Traveler Details
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Traveler Details (${details.travelers.length} / ${details.report.groupSize})`, 14, yPos);
        yPos += 7;

        const travelerCols = ["Name", "Nationality", "Passport No.", "Phone", "Emergency Contact"];
        const travelerRows = details.travelers.map(t => [
            t.name,
            t.nationality,
            t.passportNumber,
            t.phone,
            t.emergencyContact
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [travelerCols],
            body: travelerRows,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`guide-trip-${assignment.groupId.substring(0, 8)}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Guide Trip Details</DialogTitle>
                    <DialogDescription>
                        A summary of the trip for guides, excluding all pricing information.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    {isLoading || !details ? (
                        <div className="flex h-96 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Trip Info */}
                            <div className="rounded-lg border p-4 space-y-2">
                                <h3 className="font-semibold text-lg">{details.report.trekName}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span>Group: <span className="font-medium text-foreground">{details.report.groupName}</span></span>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span>Start Date: <span className="font-medium text-foreground">{format(new Date(details.report.startDate), 'PPP')}</span></span>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span>Group Size: <span className="font-medium text-foreground">{details.report.groupSize}</span></span>
                                </div>
                            </div>

                            {/* Team */}
                            <div>
                                <h4 className="font-semibold mb-2">Assigned Team</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-4">
                                        <h5 className="font-medium flex items-center gap-2 mb-2"><User className="h-4 w-4"/> Guides ({details.guides.length})</h5>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {details.guides.map(g => (
                                                <div key={g.id} className="flex justify-between">
                                                    <span>{g.name}</span>
                                                    <span className="text-muted-foreground">{g.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <h5 className="font-medium flex items-center gap-2 mb-2"><Backpack className="h-4 w-4"/> Porters ({details.porters.length})</h5>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {details.porters.map(p => (
                                                <div key={p.id} className="flex justify-between">
                                                    <span>{p.name}</span>
                                                    <span className="text-muted-foreground">{p.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Travelers */}
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><UsersIcon className="h-5 w-5"/> Traveler Details</h4>
                                <div className="border rounded-lg">
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
                                            {details.travelers.length > 0 ? details.travelers.map((traveler) => (
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrintPdf} disabled={isLoading || !details}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF for Guide
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
