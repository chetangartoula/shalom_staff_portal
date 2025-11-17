
"use client";

import { useState, useEffect } from 'react';
import { Loader2, FileDown, User } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Traveler } from '@/lib/types';


interface Report {
    groupId: string;
    trekName: string;
    groupName: string;
    groupSize: number;
    joined: number;
    pending: number;
}

interface TravelerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
}

const isPDF = (dataUrl: string) => typeof dataUrl === 'string' && dataUrl.startsWith('data:application/pdf');

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
        if (!report || travelers.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No traveler data to print.' });
            return;
        }

        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageLeftMargin = 15;
        const pageRightMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - pageLeftMargin - pageRightMargin;
        let yPos = 20;

        doc.setFontSize(18);
        doc.text(`Traveler Details for ${report.trekName}`, pageLeftMargin, yPos);
        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Group: ${report.groupName} (ID: ${report.groupId})`, pageLeftMargin, yPos);
        yPos += 15;

        for (const traveler of travelers) {
            const pageHeight = doc.internal.pageSize.getHeight();
            // Check if there's enough space for the next traveler's data
            if (yPos > pageHeight - 100) { // Estimate space needed
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(traveler.name, pageLeftMargin, yPos);
            yPos += 8;

            const details = [
                ['Nationality', traveler.nationality || 'N/A'],
                ['Passport No.', traveler.passportNumber || 'N/A'],
                ['Phone', traveler.phone || 'N/A'],
                ['Emergency Contact', traveler.emergencyContact || 'N/A'],
                ['Address', traveler.address || 'N/A'],
            ];

            const startY = yPos;
            const textX = pageLeftMargin + 40;
            
            // Draw details
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            details.forEach(detail => {
                doc.setFont('helvetica', 'bold');
                doc.text(detail[0] + ':', pageLeftMargin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(detail[1], textX, yPos);
                yPos += 6;
            });

            // Draw Profile Picture
            if (traveler.profilePicture) {
                doc.addImage(traveler.profilePicture, 'JPEG', pageLeftMargin + 120, startY, 30, 30);
            }
            
            yPos = Math.max(yPos, startY + 35); // Ensure yPos is below image

            // Draw Passport and Visa
            const images = [
                { label: 'Passport', data: traveler.passportPhoto },
                { label: 'Visa', data: traveler.visaPhoto },
            ];

            let imgX = pageLeftMargin;
            const imgWidth = contentWidth / 2 - 5;
            const imgHeight = (imgWidth * 2) / 3;

            for (const img of images) {
                if (img.data && typeof img.data === 'string') {
                    if (yPos > pageHeight - (imgHeight + 15)) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(img.label, imgX, yPos);
                    yPos += 5;
                    
                    if(isPDF(img.data)){
                        doc.text('PDF uploaded, cannot display.', imgX, yPos);
                        yPos += 5;
                    } else {
                        doc.addImage(img.data, 'JPEG', imgX, yPos, imgWidth, imgHeight);
                    }
                    
                    if (imgX === pageLeftMargin) {
                        imgX = pageLeftMargin + contentWidth / 2 + 5;
                    } else {
                        yPos += imgHeight + 10;
                        imgX = pageLeftMargin;
                    }
                }
            }
             if (imgX !== pageLeftMargin) { // If only one image was drawn
                yPos += imgHeight + 10;
            }


            yPos += 5; // spacing between travelers
            doc.setDrawColor(200);
            doc.line(pageLeftMargin, yPos, pageWidth - pageRightMargin, yPos);
            yPos += 10;
        }

        doc.save(`travelers-${report.groupId.substring(0, 8)}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Traveler Details</DialogTitle>
                    <DialogDescription>
                        Details for trek: <span className="font-medium text-primary">{report?.trekName}</span>, Group: <span className="font-medium text-primary">{report?.groupName}</span> (ID: {report?.groupId.substring(0, 8)}...)
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
                                    <TableHead>Profile</TableHead>
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
