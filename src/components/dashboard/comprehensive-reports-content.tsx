"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ComprehensiveReportsContent() {
  const { data, error, isLoading } = useSWR<ComprehensiveData>('/api/comprehensive-reports', fetcher);
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
        
        // Add group header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Group ${index + 1}: ${report.groupName}`, pageLeftMargin, yPos);
        yPos += 7;
        
        // Group details in table format
        const groupDetails = [
          ['Trek Name:', report.trekName],
          ['Start Date:', report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'],
          ['Group Size:', report.groupSize.toString()]
        ];
        
        autoTable(doc, {
          startY: yPos,
          body: groupDetails,
          theme: 'grid',
          styles: { 
            fontSize: 9, 
            font: 'helvetica',
            cellPadding: 2
          },
          columnStyles: { 
            0: { 
              fontStyle: 'bold', 
              halign: 'left',
              cellWidth: 25
            },
            1: { 
              halign: 'left'
            }
          },
          margin: { left: pageLeftMargin + 5, right: pageRightMargin },
          tableWidth: 'auto'
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      });
      
      yPos += 5;
    }
    
    // Check if we need a new page for payment history
    if (yPos > pageHeight - 150) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    
    // --- Payment History Section ---
    if (traveler.transactions && traveler.transactions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Payment History", pageLeftMargin, yPos);
      yPos += 10;
      
      const transactionCols = ["Date", "Type", "Amount", "Note"];
      const transactionRows = traveler.transactions.map((t: { date: string; type: string; amount: number; note?: string }) => [
        format(new Date(t.date), 'MMM dd, yyyy'),
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        formatCurrency(t.amount),
        t.note || 'N/A'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [transactionCols],
        body: transactionRows,
        theme: 'striped',
        headStyles: { 
          fillColor: brandColor, 
          font: 'helvetica',
          fontSize: 10
        },
        styles: { 
          font: 'helvetica', 
          fontSize: 9,
          cellPadding: 4
        },
        margin: { left: pageLeftMargin, right: pageRightMargin },
        tableWidth: 'auto'
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Check if we need a new page for financial summary
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    
    // --- Financial Summary Section ---
    if (traveler.reports && traveler.reports.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Financial Summary", pageLeftMargin, yPos);
      yPos += 10;
      
      // Create summary for each group
      traveler.reports.forEach((report: any, index: number) => {
        if (report.paymentDetails) {
          // Group header for financial summary
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${report.groupName}`, pageLeftMargin + 5, yPos);
          yPos += 7;
          
          // Financial data for this group
          const financialData = [
            ['Total Cost:', formatCurrency(report.paymentDetails.totalCost || 0)],
            ['Total Paid:', formatCurrency(report.paymentDetails.totalPaid || 0)],
            ['Balance Due:', formatCurrency(report.paymentDetails.balance || 0)]
          ];
          
          autoTable(doc, {
            startY: yPos,
            body: financialData,
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
                cellWidth: 30
              },
              1: { 
                fontStyle: 'bold', 
                halign: 'right',
                cellWidth: 25
              }
            },
            margin: { left: pageLeftMargin + 10, right: pageRightMargin },
            tableWidth: 'wrap'
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });
      
      yPos += 10;
    }
    
    // --- Footer ---
    const footerY = pageHeight - pageBottomMargin;
    
    // Footer divider
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(pageLeftMargin, footerY - 15, pageWidth - pageRightMargin, footerY - 15);
    
    // Footer content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text("Generated on: " + format(new Date(), 'PPP'), pageLeftMargin, footerY);
    doc.text("Confidential - Traveler Report", pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - pageRightMargin, footerY, { align: 'right' });
    
    // Save the document
    const filename = `traveler-${traveler.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleDownloadSelected = async () => {
    // For now, we'll just download the first selected item
    // In a full implementation, we would create a combined report
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length > 0) {
      // Find the first selected item and its type
      // This is a simplified implementation
      alert(`Downloading report for ${selectedIds.length} selected travelers. In a full implementation, this would generate individual reports for each.`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500">Error loading data. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Traveler Reports</h1>
        <p className="text-muted-foreground text-sm">
          View detailed information about individual travelers and generate comprehensive reports.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search travelers..."
            className="w-full md:w-[250px] lg:w-[300px] pl-9 pr-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadSelected} 
            disabled={Object.keys(selectedItems).filter(id => selectedItems[id]).length === 0}
            className="w-full md:w-auto"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download Selected
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Travelers</CardTitle>
          <CardDescription>Comprehensive information about individual travelers including their group associations, payment history, and documentation.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile view - cards for small screens */}
          <div className="lg:hidden space-y-4">
            {filteredTravelers.length > 0 ? filteredTravelers.map((traveler: EnrichedTraveler) => (
              <div key={`${traveler.id}-${traveler.groupId}`} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selectedItems[`${traveler.id}-${traveler.groupId}`] || false}
                      onChange={() => handleSelectItem(`${traveler.id}-${traveler.groupId}`)}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="font-medium">{traveler.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {traveler.reports && traveler.reports.length > 0 
                          ? traveler.reports.map((report: Report) => report.groupName).join(', ') 
                          : 'No groups'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport(traveler)}>
                    <FileDown className="h-4 w-4" />
                    <span className="sr-only">Download Report</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{traveler.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="truncate max-w-[150px]">{traveler.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Passport</p>
                    <p>{traveler.passportNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className={cn("font-medium", 
                      traveler.reports && traveler.reports.some((report: Report) => 
                        report?.paymentDetails?.balance > 0
                      ) ? 'text-red-600' : 'text-green-600')}>
                      {traveler.reports && traveler.reports.length > 0 
                        ? formatCurrency(
                            traveler.reports.reduce((sum: number, report: Report) => 
                              sum + (report?.paymentDetails?.balance || 0), 0
                            )
                          ) 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No travelers found.
              </div>
            )}
          </div>
          
          {/* Desktop view - table for larger screens */}
          <div className="hidden lg:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input 
                      type="checkbox" 
                      checked={filteredTravelers.length > 0 && filteredTravelers.every((t: any) => selectedItems[`${t.id}-${t.groupId}`])}
                      onChange={() => {
                        if (filteredTravelers.every((t: any) => selectedItems[`${t.id}-${t.groupId}`])) {
                          // Deselect all
                          const newSelections = {...selectedItems};
                          filteredTravelers.forEach((t: any) => delete newSelections[`${t.id}-${t.groupId}`]);
                          setSelectedItems(newSelections);
                        } else {
                          // Select all
                          handleSelectAll(filteredTravelers);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[150px] hidden md:table-cell">Groups</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="min-w-[150px] hidden lg:table-cell">Email</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Passport</TableHead>
                  <TableHead className="min-w-[100px]">Balance</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTravelers.length > 0 ? filteredTravelers.map((traveler: EnrichedTraveler) => (
                  <TableRow key={`${traveler.id}-${traveler.groupId}`}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedItems[`${traveler.id}-${traveler.groupId}`] || false}
                        onChange={() => handleSelectItem(`${traveler.id}-${traveler.groupId}`)}
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">{traveler.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate hidden md:table-cell">
                      {traveler.reports && traveler.reports.length > 0 
                        ? traveler.reports.map((report: Report) => report.groupName).join(', ') 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] hidden sm:table-cell">{traveler.phone || 'N/A'}</TableCell>
                    <TableCell className="truncate max-w-[150px] hidden lg:table-cell">{traveler.email || 'N/A'}</TableCell>
                    <TableCell className="truncate max-w-[120px] hidden md:table-cell">{traveler.passportNumber || 'N/A'}</TableCell>
                    <TableCell className={cn("font-medium truncate max-w-[100px]", 
                      traveler.reports && traveler.reports.some((report: Report) => 
                        report?.paymentDetails?.balance > 0
                      ) ? 'text-red-600' : 'text-green-600')}>
                      {traveler.reports && traveler.reports.length > 0 
                        ? formatCurrency(
                            traveler.reports.reduce((sum: number, report: Report) => 
                              sum + (report?.paymentDetails?.balance || 0), 0
                            )
                          ) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReport(traveler)}>
                        <FileDown className="h-4 w-4" />
                        <span className="sr-only">Download Report</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No travelers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}