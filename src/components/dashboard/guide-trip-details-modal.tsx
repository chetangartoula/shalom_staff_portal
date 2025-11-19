"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, FileDown, User, Backpack, Users as UsersIcon, Ticket, ConciergeBell, Plane } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/shadcn/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Separator } from '@/components/ui/shadcn/separator';
import { useToast } from '@/hooks/use-toast';
import type { Guide, Porter, SectionState, Traveler, AirportPickUp } from '@/lib/types';
import { logoUrl } from '../logo';

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
        permits: SectionState;
        services: SectionState;
    };
    travelers: Traveler[];
    guides: Guide[];
    porters: Porter[];
    airportPickUp: AirportPickUp[]; // Add this line
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
                setDetails(null);
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
        const brandColor = [21, 29, 79]; // #151D4F
        const pageLeftMargin = 14;
        const pageRightMargin = 14;
        const pageTopMargin = 20;
        let yPos = pageTopMargin;

        // Header
        const logoWidth = 50;
        const logoHeight = (logoWidth * 54) / 256; // Maintain aspect ratio
        
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });

        doc.addImage(dataUrl as string, 'PNG', pageLeftMargin, pageTopMargin - 10, logoWidth, logoHeight);

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.text(`Trip Details`, doc.internal.pageSize.width - pageRightMargin, pageTopMargin, { align: 'right' });
        
        yPos += logoHeight > 15 ? logoHeight - 15 : 0;
        
        doc.setDrawColor(200);
        doc.line(pageLeftMargin, yPos, doc.internal.pageSize.width - pageRightMargin, yPos);
        yPos += 8;

        // Trip Info
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(details.report.trekName, pageLeftMargin, yPos);
        yPos += 6;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Group: ${details.report.groupName} | Start Date: ${format(new Date(details.report.startDate), 'PPP')}`, pageLeftMargin, yPos);
        yPos += 12;

        // Team Details
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Assigned Team", pageLeftMargin, yPos);
        yPos += 7;

        const guidesText = details.guides.map(g => `${g.name} (${g.phone})`).join('\n');
        const portersText = details.porters.map(p => `${p.name} (${p.phone})`).join('\n');
        const airportPickUpText = details.airportPickUp.map(a => `${a.name} (${a.phone})`).join('\n'); // Add this line

        autoTable(doc, {
            startY: yPos,
            body: [
                ['Guides', guidesText || 'None'],
                ['Porters', portersText || 'None'],
                ['Airport Pickup', airportPickUpText || 'None'], // Add this line
            ],
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: { top: 2, right: 2, bottom: 2, left: 2 }, font: 'helvetica' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        
        // Permits
        if (details.report.permits.rows.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Permits Included", pageLeftMargin, yPos);
            yPos += 7;
            autoTable(doc, {
                startY: yPos,
                head: [['Permit Name']],
                body: details.report.permits.rows.map(r => [r.description]),
                theme: 'striped',
                headStyles: { fillColor: brandColor, font: 'helvetica' },
                styles: { font: 'helvetica' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Services
        if (yPos > 240) { doc.addPage(); yPos = pageTopMargin; }
        if (details.report.services.rows.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Services Included", pageLeftMargin, yPos);
            yPos += 7;
            autoTable(doc, {
                startY: yPos,
                head: [['Service Name']],
                body: details.report.services.rows.map(r => [r.description]),
                theme: 'striped',
                headStyles: { fillColor: brandColor, font: 'helvetica' },
                styles: { font: 'helvetica' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Traveler Details
        if (yPos > 240) { doc.addPage(); yPos = pageTopMargin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Traveler Details (${details.travelers.length} / ${details.report.groupSize})`, pageLeftMargin, yPos);
        yPos += 7;

        const travelerCols = ["Profile", "Name", "Nationality", "Passport No.", "Phone", "Emergency Contact"];
        const travelerRows = details.travelers.map(t => [
            '', // Placeholder for image
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
            headStyles: { fillColor: brandColor, font: 'helvetica' },
            styles: { font: 'helvetica' },
            didDrawCell: (data) => {
              if (data.section === 'body' && data.column.index === 0) {
                const traveler = details.travelers[data.row.index];
                if (traveler.profilePicture) {
                  try {
                    doc.addImage(traveler.profilePicture, 'JPEG', data.cell.x + 2, data.cell.y + 2, 10, 10);
                  } catch (e) {
                    console.error("Error adding image to PDF:", e);
                  }
                }
              }
            },
            rowPageBreak: 'avoid'
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Changed to 3 columns */}
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
                                    {/* Add this section for airport pickup */}
                                    <div className="rounded-lg border p-4">
                                        <h5 className="font-medium flex items-center gap-2 mb-2"><Plane className="h-4 w-4"/> Airport Pickup ({details.airportPickUp.length})</h5>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {details.airportPickUp.map(a => (
                                                <div key={a.id} className="flex justify-between">
                                                    <span>{a.name}</span>
                                                    <span className="text-muted-foreground">{a.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Permits & Services */}
                             <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-4">
                                        <h5 className="font-medium flex items-center gap-2 mb-2"><Ticket className="h-4 w-4"/> Permits Included</h5>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                           {details.report.permits.rows.length > 0 ? details.report.permits.rows.map(p => (
                                               <li key={p.id}>{p.description}</li>
                                           )) : <li className="text-muted-foreground">No specific permits listed.</li>}
                                        </ul>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <h5 className="font-medium flex items-center gap-2 mb-2"><ConciergeBell className="h-4 w-4"/> Services Included</h5>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            {details.report.services.rows.length > 0 ? details.report.services.rows.map(s => (
                                               <li key={s.id}>{s.description}</li>
                                           )) : <li className="text-muted-foreground">No specific services listed.</li>}
                                        </ul>
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
                                                <TableHead>Profile</TableHead>
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
                                                     <TableCell>
                                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                            {traveler.profilePicture ? (
                                                                <Image src={traveler.profilePicture} alt={traveler.name} width={40} height={40} className="object-cover" />
                                                            ) : (
                                                                <User className="h-6 w-6 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{traveler.name}</TableCell>
                                                    <TableCell>{traveler.nationality || 'N/A'}</TableCell>
                                                    <TableCell>{traveler.passportNumber}</TableCell>
                                                    <TableCell>{traveler.phone}</TableCell>
                                                    <TableCell>{traveler.emergencyContact}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">
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
