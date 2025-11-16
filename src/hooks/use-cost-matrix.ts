"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

import type { Trek, CostRow, SectionState } from "@/lib/types";

// Define a type for the entire report state
type ReportState = {
  groupId: string;
  trekId: string | null;
  trekName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
};

const initialSteps = [
  { id: "01", name: "Select Trek" },
  { id: "02", name: "Group Details" },
  { id: "03", name: "Permits & Food" },
  { id: "04", name: "Services" },
  { id: "05", name: "Final" },
];

// Helper to create an initial empty report state
const createInitialReportState = (): ReportState => ({
  groupId: uuidv4(),
  trekId: null,
  trekName: '',
  groupSize: 1,
  startDate: new Date(),
  permits: { id: 'permits', name: 'Permits & Food', rows: [], discount: 0 },
  services: { id: 'services', name: 'Services', rows: [], discount: 0 },
  extraDetails: { id: 'extraDetails', name: 'Extra Details', rows: [], discount: 0 },
  customSections: [],
  serviceCharge: 10,
});

export async function handleExportPDF({
  selectedTrek,
  report,
  calculateSectionTotals,
  userName
}: {
  selectedTrek: Trek | undefined,
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number },
  userName?: string
}) {
  if (!selectedTrek) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { default: QRCode } = await import("qrcode");

  const doc = new jsPDF();
  const qrCodeUrl = `${window.location.origin}/report/${report.groupId}?groupSize=${report.groupSize}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
  
  const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];

  const sectionsToExport = allSections.map(section => ({
      ...section,
      rows: section.rows.filter(row => row.total !== 0)
  })).filter(section => section.rows.length > 0);

  let yPos = 0;
  const pageTopMargin = 15;
  const pageLeftMargin = 14;
  const pageRightMargin = 14;

  const addFooter = () => {
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150);
          
          const preparedByText = `Prepared by: ${userName || 'N/A'}`;
          doc.text(preparedByText, pageLeftMargin, pageHeight - 15);
          doc.text('Signature: ..........................', pageLeftMargin, pageHeight - 10);
          
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 35, pageHeight - 10);
      }
  };
  
  const qrCodeSize = 40;
  const qrCodeX = doc.internal.pageSize.width - qrCodeSize - pageRightMargin;
  
  doc.setFontSize(22);
  doc.text("Cost Calculation Report", pageLeftMargin, pageTopMargin + 7);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Group ID: ${report.groupId}`, pageLeftMargin, pageTopMargin + 15);
  
  doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, pageTopMargin, qrCodeSize, qrCodeSize);

  yPos = Math.max(pageTopMargin + 25, pageTopMargin + qrCodeSize) + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Group Details", pageLeftMargin, yPos);
  yPos += 7;
  autoTable(doc, {
      startY: yPos,
      body: [
          ['Trek Name', selectedTrek.name || 'N/A'],
          ['Group Size', report.groupSize.toString()],
          ['Start Date', report.startDate ? format(report.startDate, 'PPP') : 'N/A'],
      ],
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' } }
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  sectionsToExport.forEach(section => {
    if (yPos > 250) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(section.name, pageLeftMargin, yPos);
    yPos += 10;
    
    const head = [['#', 'Description', 'Rate', 'No', 'Times', 'Total']];
    const body = section.rows.map((row, i) => [
        i + 1,
        row.description,
        `$${row.rate.toFixed(2)}`,
        row.no,
        row.times,
        `$${row.total.toFixed(2)}`
    ]);
    const {subtotal, total} = calculateSectionTotals(section);

    body.push(['', 'Subtotal', '', '', '', `$${subtotal.toFixed(2)}`]);
    if (section.discount > 0) {
      body.push(['', 'Discount', '', '', '', `- $${section.discount.toFixed(2)}`]);
    }
    body.push(['', 'Total', '', '', '', `$${total.toFixed(2)}`]);

    autoTable(doc, {
        startY: yPos,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [21, 29, 79] }, // #151D4F
        didDrawPage: (data: any) => {
            yPos = data.cursor?.y || yPos;
        }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  });

  const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);

  if (sectionsToExport.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", pageLeftMargin, yPos);
    yPos += 10;

    const summaryData = sectionsToExport.map(section => {
      const { total } = calculateSectionTotals(section);
      return [`${section.name} Total`, `$${total.toFixed(2)}`];
    });
    summaryData.push(['Grand Total', `$${grandTotal.toFixed(2)}`]);
    
    autoTable(doc, {
        startY: yPos,
        body: summaryData,
        theme: 'plain'
    });
  }

  addFooter();

  doc.save(`cost-report-${report.groupId.substring(0,8)}.pdf`);
}

export async function handleExportExcel({
  report,
  calculateSectionTotals
}: {
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number },
}) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();
   
   const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];
   const sectionsToExport = allSections.map(section => ({
      ...section,
      rows: section.rows.filter(row => row.total !== 0)
   })).filter(section => {
     return section.rows.length > 0;
   });

   sectionsToExport.forEach(section => {
     const {subtotal, total} = calculateSectionTotals(section);
     const wsData = section.rows.map(row => ({
       Description: row.description,
       Rate: row.rate,
       No: row.no,
       Times: row.times,
       Total: row.total,
     }));
     wsData.push({Description: 'Subtotal', Rate: '', No: '', Times: '', Total: subtotal});
     if(section.discount > 0) {
       wsData.push({Description: 'Discount', Rate: '', No: '', Times: '', Total: -section.discount});
     }
     wsData.push({Description: 'Total', Rate: '', No: '', Times: '', Total: total});
     const ws = XLSX.utils.json_to_sheet(wsData);
     XLSX.utils.book_append_sheet(wb, ws, section.name.substring(0, 31));
   });
   
  const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
   
  if (sectionsToExport.length > 0) {
    const summaryWsData = sectionsToExport.map(section => {
      const { total } = calculateSectionTotals(section);
      return { Item: `${section.name} Total`, Amount: total };
    });
    summaryWsData.push({ Item: 'Grand Total', Amount: grandTotal });

    const summaryWs = XLSX.utils.json_to_sheet(summaryWsData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  }

   XLSX.writeFile(wb, `cost-report-${report.groupId.substring(0,8)}.xlsx`);
}

export function useCostMatrix(treks: Trek[] | undefined, initialData?: any) {
  const { toast } = useToast();
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [report, setReport] = useState<ReportState>(createInitialReportState());

  const [usePax, setUsePax] = useState<{[key: string]: boolean}>({});

  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    if (initialData) {
        const fullReport = {
            ...createInitialReportState(),
            ...initialData,
            startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        };
        setReport(fullReport);

        const newSteps = [...initialSteps];
        const finalStepIndex = newSteps.findIndex(s => s.name === "Final");
        if(initialData.customSections) {
            initialData.customSections.forEach((section: SectionState) => {
                const newStep = { id: `custom_step_${section.id}`, name: section.name };
                newSteps.splice(finalStepIndex, 0, newStep);
            });
            setSteps(newSteps);
        }
    }
    setIsLoading(false);
  }, [initialData]);

  const selectedTrek = useMemo(
    () => treks?.find((trek) => trek.id === report.trekId),
    [report.trekId, treks]
  );
  
  const handleSetUsePax = useCallback((sectionId: string, value: boolean) => {
    setUsePax(prev => ({...prev, [sectionId]: value}));
  }, []);

  useEffect(() => {
    const isPaxEnabled = (sectionId: string) => usePax[sectionId] ?? false;

    setReport(currentReport => {
        let changed = false;
        const newReport = { ...currentReport };
        const sectionsToUpdate: (keyof ReportState)[] = ['permits', 'services', 'extraDetails'];

        sectionsToUpdate.forEach(sectionKey => {
            const section = newReport[sectionKey] as SectionState;
            if (isPaxEnabled(section.id)) {
                const newRows = section.rows.map(row => {
                    if (row.no !== currentReport.groupSize) {
                        changed = true;
                        const newNo = currentReport.groupSize;
                        return { ...row, no: newNo, total: (row.rate || 0) * newNo * (row.times || 0) };
                    }
                    return row;
                });
                if(changed) {
                    (newReport[sectionKey] as SectionState) = { ...section, rows: newRows };
                }
            }
        });
        
        const newCustomSections = newReport.customSections.map(section => {
            if (isPaxEnabled(section.id)) {
                const newRows = section.rows.map(row => {
                    if (row.no !== currentReport.groupSize) {
                        changed = true;
                        const newNo = currentReport.groupSize;
                        return { ...row, no: newNo, total: (row.rate || 0) * newNo * (row.times || 0) };
                    }
                    return row;
                });
                 if(changed) return { ...section, rows: newRows };
            }
            return section;
        });

        if (changed) {
            newReport.customSections = newCustomSections;
            return newReport;
        }

        return currentReport;
    });
  }, [report.groupSize, usePax]);

  const handleTrekSelect = useCallback((trekId: string) => {
    const newSelectedTrek = treks?.find(t => t.id === trekId);
    if (!newSelectedTrek) return;

    setReport(prev => {
        const isPax = usePax['permits'] ?? false;
        const numberValue = isPax ? prev.groupSize : 1;
        const initialPermits = newSelectedTrek.permits.map(p => ({
            id: uuidv4(),
            description: p.name,
            rate: p.rate,
            no: numberValue,
            times: 1,
            total: p.rate * numberValue,
        }));

        const initialExtraDetails = [
            { id: uuidv4(), description: 'Satellite device', rate: 0, no: 1, times: 12, total: 0 },
            { id: uuidv4(), description: 'Adv less', rate: 0, no: 1, times: 0, total: 0 }
        ];

        return {
            ...prev,
            trekId: newSelectedTrek.id,
            trekName: newSelectedTrek.name,
            permits: { ...prev.permits, rows: initialPermits },
            extraDetails: { ...prev.extraDetails, rows: initialExtraDetails },
        };
    });
  }, [treks, usePax]);

  const handleDetailChange = useCallback((field: keyof ReportState, value: any) => {
      setReport(prev => ({...prev, [field]: value}));
  }, []);

  const handleSectionUpdate = useCallback((sectionId: string, updatedSection: Partial<SectionState> | ((s: SectionState) => SectionState)) => {
    setReport(prevReport => {
        const newReport = {...prevReport};
        if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
            const currentSection = newReport[sectionId];
            newReport[sectionId] = typeof updatedSection === 'function' ? updatedSection(currentSection) : { ...currentSection, ...updatedSection };
        } else {
            newReport.customSections = newReport.customSections.map(s => 
                s.id === sectionId ? (typeof updatedSection === 'function' ? updatedSection(s) : { ...s, ...updatedSection }) : s
            );
        }
        return newReport;
    });
  }, []);

  const handleRowChange = useCallback((id: string, field: keyof CostRow, value: any, sectionId: string) => {
    handleSectionUpdate(sectionId, (section) => ({
      ...section,
      rows: section.rows.map((row) => {
        if (row.id === id) {
          const newRow = { ...row, [field]: value };
          if (field === 'no' || field === 'rate' || field === 'times') {
            newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
          }
          return newRow;
        }
        return row;
      })
    }));
  }, [handleSectionUpdate]);
  
  const handleDiscountChange = useCallback((sectionId: string, value: number) => {
    handleSectionUpdate(sectionId, { discount: value });
  }, [handleSectionUpdate]);

  const addRow = useCallback((sectionId: string) => {
    const newRow: CostRow = { id: uuidv4(), description: "", rate: 0, no: 1, times: 1, total: 0 };
    handleSectionUpdate(sectionId, (prev) => ({...prev, rows: [...prev.rows, newRow]}));
  }, [handleSectionUpdate]);

  const removeRow = useCallback((id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => ({...prev, rows: prev.rows.filter((row) => row.id !== id)}));
  }, [handleSectionUpdate]);

  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({...prev, customSections: prev.customSections.filter(s => s.id !== sectionId)}));
    setSteps(prev => prev.filter(s => s.id !== `custom_step_${sectionId}`));
  }, []);
  
  const setCustomSections = useCallback((updater: (prev: SectionState[]) => SectionState[]) => {
      setReport(prev => ({...prev, customSections: updater(prev.customSections)}));
  }, []);

  const calculateSectionTotals = useCallback((section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const total = subtotal - section.discount;
    return { subtotal, total };
  }, []);

  const totalCost = useMemo(() => {
    const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
    return sections.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
  }, [report, calculateSectionTotals]);

  const getReportPayload = useCallback(() => {
    const url = `${window.location.origin}/report/${report.groupId}?groupSize=${report.groupSize}`;
    return { ...report, reportUrl: url };
  }, [report]);

  const handleSave = useCallback(async () => {
    const payload = getReportPayload();
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save report');
      setSavedReportUrl(payload.reportUrl);
      toast({ title: "Data Saved", description: "Your trek costing details have been saved." });
    } catch(error) {
       toast({ variant: "destructive", title: "Error", description: "Could not save the report." });
    }
  }, [getReportPayload, toast]);

  const handleUpdate = useCallback(async () => {
    const payload = getReportPayload();
    try {
      const response = await fetch(`/api/reports/${payload.groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update report');
      toast({ title: "Report Updated", description: "Your changes have been saved." });
    } catch(error) {
       toast({ variant: "destructive", title: "Error", description: "Could not update the report." });
    }
  }, [getReportPayload, toast]);

  const handleCopyToClipboard = useCallback(() => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Report link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [savedReportUrl, toast]);

  return {
    report,
    steps,
    setSteps,
    currentStep,
    setCurrentStep,
    isLoading,
    selectedTrek,
    handleTrekSelect,
    handleDetailChange,
    handleRowChange,
    handleDiscountChange,
    addRow,
    removeRow,
    removeSection,
    setCustomSections,
    handleSave,
    handleUpdate,
    savedReportUrl,
    isCopied,
    handleCopyToClipboard,
    calculateSectionTotals,
    usePax,
    handleSetUsePax,
    totalCost
  };
}
