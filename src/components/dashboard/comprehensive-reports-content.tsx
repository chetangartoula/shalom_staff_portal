"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, FileDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/shadcn/table";
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import type { Report, Traveler } from '@/lib/types';

interface EnrichedTraveler extends Traveler {
  reports?: Report[];
  transactions?: any[];
}

import { cn, formatCurrency } from '@/lib/utils';
import { logoUrl } from '@/components/logo';

interface ComprehensiveData {
  reports: Report[];
  travelers: Traveler[];
  assignments: any[];
  transactions: any[];
  guides: any[];
  porters: any[];
  airportPickUp: any[];
  timestamp: string;
}

export function ComprehensiveReportsContent() {
  // Use React Query to fetch comprehensive reports data
  const { data, error, isLoading } = useQuery<ComprehensiveData>({
    queryKey: ['comprehensiveReports'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/comprehensive-reports');
        if (!response.ok) {
          throw new Error('Failed to fetch comprehensive reports data');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching comprehensive reports data:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  // Create a map of groupId to report for easy lookup
  const reportMap = useMemo(() => {
    if (!data?.reports) return new Map();
    return new Map(data.reports.map(report => [report.groupId, report]));
  }, [data?.reports]);
  
  // Create a map of groupId to transactions for easy lookup
  const transactionsMap = useMemo(() => {
    if (!data?.transactions) return new Map();
    const map = new Map();
    data.transactions.forEach(transaction => {
      if (!map.has(transaction.groupId)) {
        map.set(transaction.groupId, []);
      }
      map.get(transaction.groupId).push(transaction);
    });
    return map;
  }, [data?.transactions]);
  
  // Create a map of groupId to assignments for easy lookup
  const assignmentsMap = useMemo(() => {
    if (!data?.assignments) return new Map();
    return new Map(data.assignments.map(assignment => [assignment.groupId, assignment]));
  }, [data?.assignments]);
  
  // Enrich travelers with group, payment, and assignment information
  const enrichedTravelers = useMemo(() => {
    if (!data?.travelers) return [];
    
    // Create a unique list of travelers using a combination of traveler ID and group ID
    const uniqueTravelers: EnrichedTraveler[] = [];
    data.travelers.forEach((traveler: Traveler) => {
      const reports = traveler.groupId ? [reportMap.get(traveler.groupId)].filter(Boolean) : [];
      const transactions = traveler.groupId ? transactionsMap.get(traveler.groupId) || [] : [];
      
      uniqueTravelers.push({
        ...traveler,
        reports,
        transactions
      });
    });
    
    return uniqueTravelers;
  }, [data?.travelers, reportMap, transactionsMap]);
  
  // Filter data based on search term
  const filteredTravelers = useMemo(() => {
    return enrichedTravelers.filter((traveler: EnrichedTraveler) =>
      traveler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (traveler.reports && traveler.reports.some((report: Report) => 
        report?.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report?.trekName?.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      traveler.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [enrichedTravelers, searchTerm]);

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = (items: EnrichedTraveler[]) => {
    const newSelections: Record<string, boolean> = {};
    items.forEach((item: EnrichedTraveler) => {
      newSelections[`${item.id}-${item.groupId}`] = true;
    });
    setSelectedItems(prev => ({ ...prev, ...newSelections }));
  };

  const handleDeselectAll = () => {
    setSelectedItems({});
  };

  const handleDownloadReport = async (traveler: EnrichedTraveler) => {
    // Import jsPDF and autoTable dynamically
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    doc.setFont("helvetica");
    
    // Page dimensions and margins
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const pageLeftMargin = 20;
    const pageRightMargin = 20;
    const pageTopMargin = 20;
    const pageBottomMargin = 20;
    const contentWidth = pageWidth - pageLeftMargin - pageRightMargin;
    
    const brandColor: [number, number, number] = [21, 29, 79]; // #151D4F
    let yPos = pageTopMargin;
    
    // --- Header with Logo ---
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      // Add logo
      const logoWidth = 60;
      const logoHeight = (logoWidth * 54) / 256; // Maintain aspect ratio
      doc.addImage(dataUrl, 'PNG', pageLeftMargin, yPos, logoWidth, logoHeight);
      
      // Add title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandColor);
      doc.text("Traveler Report", pageWidth - pageRightMargin, yPos + 10, { align: 'right' });
      
      yPos += logoHeight + 15;
    } catch (error) {
      // Fallback if logo fails to load
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandColor);
      doc.text("Traveler Report", pageWidth - pageRightMargin, yPos, { align: 'right' });
      yPos += 20;
    }
    
    // Header divider
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(pageLeftMargin, yPos, pageWidth - pageRightMargin, yPos);
    yPos += 15;
    
    // --- Traveler Information ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(traveler.name, pageLeftMargin, yPos);
    yPos += 10;
    
    // Traveler details in table format
    const travelerDetails = [
      ['Phone:', traveler.phone || 'N/A'],
      ['Email:', traveler.email || 'N/A'],
      ['Address:', traveler.address || 'N/A'],
      ['Emergency Contact:', traveler.emergencyContact || 'N/A'],
      ['Nationality:', traveler.nationality || 'N/A'],
      ['Passport Number:', traveler.passportNumber || 'N/A']
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: travelerDetails,
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        font: 'helvetica',
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          halign: 'left',
          cellWidth: 35
        },
        1: { 
          halign: 'left'
        }
      },
      margin: { left: pageLeftMargin, right: pageRightMargin },
      tableWidth: 'auto'
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if we need a new page for group information
    if (yPos > pageHeight - 150) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    
    // --- Group Information Section ---
    if (traveler.reports && traveler.reports.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Group Associations", pageLeftMargin, yPos);
      yPos += 10;
      
      // For each group, create a separate section
      traveler.reports.forEach((report: any, index: number) => {
        // Check if we need a new page
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = pageTopMargin;
        }
        
        // Group name and dates
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${report.trekName} - ${report.groupName}`, pageLeftMargin, yPos);
        yPos += 7;
        
        const groupDates = `Start: ${format(new Date(report.startDate), 'MMM dd, yyyy')} | End: ${format(new Date(report.endDate), 'MMM dd, yyyy')}`;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(groupDates, pageLeftMargin, yPos);
        yPos += 10;
        
        // Payment information
        const travelerTransactions = transactionsMap.get(report.groupId) || [];
        const totalPaid = travelerTransactions
          .filter((t: any) => t.type === 'payment')
          .reduce((sum: number, t: any) => sum + t.amount, 0);
          
        const totalRefunded = travelerTransactions
          .filter((t: any) => t.type === 'refund')
          .reduce((sum: number, t: any) => sum + t.amount, 0);
          
        const netPayment = totalPaid - totalRefunded;
        
        const paymentInfo = [
          ['Total Paid:', formatCurrency(totalPaid)],
          ['Total Refunded:', formatCurrency(totalRefunded)],
          ['Net Payment:', formatCurrency(netPayment)]
        ];
        
        autoTable(doc, {
          startY: yPos,
          body: paymentInfo,
          theme: 'grid',
          styles: { 
            fontSize: 10, 
            font: 'helvetica',
            cellPadding: 2
          },
          columnStyles: { 
            0: { 
              fontStyle: 'bold', 
              halign: 'left',
              cellWidth: 35
            },
            1: { 
              halign: 'right'
            }
          },
          margin: { left: pageLeftMargin + 10, right: pageRightMargin },
          tableWidth: 'auto'
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        
        // Add some spacing between groups
        if (index < (traveler.reports?.length || 0) - 1) {
          yPos += 10;
        }
      });
    }
    
    // Save the PDF
    doc.save(`traveler-report-${traveler.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-8">
        Failed to load comprehensive reports data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Comprehensive Reports</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Detailed overview of all travelers, groups, and transactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search travelers, groups, or treks..."
              className="w-full sm:w-[300px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traveler Overview</CardTitle>
          <CardDescription>
            Detailed information about travelers and their group associations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTravelers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Payments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTravelers.map((traveler) => {
                    const totalPaid = traveler.transactions
                      ?.filter((t: any) => t.type === 'payment')
                      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
                      
                    const totalRefunded = traveler.transactions
                      ?.filter((t: any) => t.type === 'refund')
                      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
                      
                    const netPayment = totalPaid - totalRefunded;
                    
                    return (
                      <TableRow key={`${traveler.id}-${traveler.groupId}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{traveler.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{traveler.phone}</div>
                            <div className="text-muted-foreground">{traveler.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {traveler.reports && traveler.reports.length > 0 ? (
                            <div className="space-y-1">
                              {traveler.reports.map((report: any) => (
                                <Badge key={report.groupId} variant="secondary" className="text-xs">
                                  {report.trekName} - {report.groupName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No group associations</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className={netPayment >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(netPayment)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Paid: {formatCurrency(totalPaid)} | Refunded: {formatCurrency(totalRefunded)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDownloadReport(traveler)}
                            className="gap-1"
                          >
                            <FileDown className="h-3 w-3" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
              {searchTerm ? `No travelers found for "${searchTerm}".` : "No traveler data available."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}