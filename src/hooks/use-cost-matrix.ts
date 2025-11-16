
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { format } from "date-fns";

import type { Trek, Service, CostRow, SectionState } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";


const initialSteps = [
  { id: "01", name: "Select Trek" },
  { id: "02", name: "Group Details" },
  { id: "03", name: "Permits & Food" },
  { id: "04", name: "Services" },
  { id: "05", name: "Final" },
];

export function useCostMatrix(treks: Trek[], initialData?: any) {
  const { toast } = useToast();
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  
  const [usePax, setUsePax] = useState<{[key: string]: boolean}>({});

  const [permitsState, setPermitsState] = useState<SectionState>({id: 'permits', name: 'Permits & Food', rows: [], discount: 0});
  const [servicesState, setServicesState] = useState<SectionState>({id: 'services', name: 'Services', rows: [], discount: 0});
  const [extraDetailsState, setExtraDetailsState] = useState<SectionState>({id: 'extraDetails', name: 'Extra Details', rows: [], discount: 0});
  const [customSections, setCustomSections] = useState<SectionState[]>([]);

  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [serviceCharge, setServiceCharge] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const servicesRes = await fetch('/api/services');

        if (!servicesRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const servicesData = await servicesRes.json();
        setServices(servicesData.services);

        if (initialData) {
          // If there's initial data, we're in "edit" mode.
          setSelectedTrekId(initialData.trekId);
          setGroupSize(initialData.groupSize);
          setStartDate(initialData.startDate ? new Date(initialData.startDate) : undefined);
          setPermitsState(initialData.permits);
          setServicesState(initialData.services);
          setExtraDetailsState(initialData.extraDetails);
          setCustomSections(initialData.customSections || []);
          setServiceCharge(initialData.serviceCharge || 10);
        } else if (treks.length > 0 && !selectedTrekId) {
          // If new report, select first trek by default.
          setSelectedTrekId(treks[0].id)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "Could not load treks and services.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, treks, initialData]);


  const selectedTrek = useMemo(
    () => treks.find((trek) => trek.id === selectedTrekId),
    [selectedTrekId, treks]
  );
  
  const handleSetUsePax = (sectionId: string, value: boolean) => {
    setUsePax(prev => ({...prev, [sectionId]: value}));
    
    const isPax = value;
    const section = getSectionState(sectionId);
    if (!section) return;

    const updatedRows = section.rows.map((row) => {
        const newNo = isPax ? groupSize : row.no;
        const newRow = { ...row, no: newNo };
        newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
        return newRow;
    });
    setSectionState(sectionId, { rows: updatedRows });
  }

  useEffect(() => {
    // This effect runs when a new trek is selected, to reset the details.
    // It should NOT run when in "edit" mode (i.e., when initialData is present).
    if (initialData || !selectedTrek || services.length === 0) return;

    const isPaxEnabled = usePax['permits'] ?? false;
    const numberValue = isPaxEnabled ? groupSize : 1;

    const initialPermits = selectedTrek.permits.map((permit) => ({
      id: uuidv4(),
      description: permit.name,
      rate: permit.rate,
      no: numberValue,
      times: 1,
      total: permit.rate * numberValue,
    }));
    setPermitsState(prev => ({...prev, name: "Permits & Food", rows: initialPermits}));

    const initialServices = services.map((service) => ({
      id: uuidv4(),
      description: service.name,
      rate: service.rate,
      no: 0, 
      times: service.times,
      total: 0,
    }));
    setServicesState(prev => ({...prev, rows: initialServices}));

      const initialExtraDetails = [
      { id: uuidv4(), description: 'Satellite device', rate: 0, no: 1, times: 12, total: 0 },
      { id: uuidv4(), description: 'Adv less', rate: 0, no: 1, times: 0, total: 0 }
    ];
    setExtraDetailsState(prev => ({...prev, rows: initialExtraDetails}));
    
  }, [selectedTrek, groupSize, services, usePax, initialData]);

  const getSectionState = (sectionId: string): SectionState | undefined => {
    if (sectionId === "permits") return permitsState;
    if (sectionId === "services") return servicesState;
    if (sectionId === "extraDetails") return extraDetailsState;
    return customSections.find(s => s.id === sectionId);
  };

  const setSectionState = (sectionId: string, newState: Partial<SectionState> | ((prevState: SectionState) => SectionState)) => {
    const updater = (prev: SectionState): SectionState => {
        if (typeof newState === 'function') {
            return newState(prev);
        }
        return { ...prev, ...newState };
    };

    if (sectionId === "permits") setPermitsState(updater);
    else if (sectionId === "services") setServicesState(updater);
    else if (sectionId === "extraDetails") setExtraDetailsState(updater);
    else {
        setCustomSections(prev => prev.map(s => s.id === sectionId ? updater(s) : s));
    }
  };

  const handleRowChange = (id: string, field: keyof CostRow, value: any, sectionId: string) => {
    const section = getSectionState(sectionId);
    if (!section) return;

    const updatedRows = section.rows.map((row) => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        if (field === 'no' || field === 'rate' || field === 'times') {
          newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
        }
        return newRow;
      }
      return row;
    });
    setSectionState(sectionId, { rows: updatedRows });
  };
  
  const handleDiscountChange = (sectionId: string, value: number) => {
    setSectionState(sectionId, { discount: value });
  };

  const addRow = (sectionId: string) => {
    const newRow: CostRow = { id: uuidv4(), description: "", rate: 0, no: 1, times: 1, total: 0 };
    setSectionState(sectionId, (prev) => ({...prev, rows: [...prev.rows, newRow]}));
  };

  const removeRow = (id: string, sectionId: string) => {
    setSectionState(sectionId, (prev) => ({...prev, rows: prev.rows.filter((row) => row.id !== id)}));
  };

  const removeSection = (sectionId: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    setSteps(prev => prev.filter(s => s.id !== `custom_step_${sectionId}`));
  };

  const calculateSectionTotals = useCallback((section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const total = subtotal - section.discount;
    return { subtotal, total };
  }, []);

  const {
    permitsTotals,
    servicesTotals,
    extraDetailsTotals,
    customSectionsTotals,
    totalCost,
  } = useMemo(() => {
    const permitsTotals = calculateSectionTotals(permitsState);
    const servicesTotals = calculateSectionTotals(servicesState);
    const extraDetailsTotals = calculateSectionTotals(extraDetailsState);
    
    const customSectionsTotals = customSections.map(section => ({
        ...section,
        ...calculateSectionTotals(section),
    }));

    const totalCustomsTotal = customSectionsTotals.reduce((acc, section) => acc + section.total, 0);

    const totalCost = permitsTotals.total + servicesTotals.total + extraDetailsTotals.total + totalCustomsTotal;

    return {
      permitsTotals,
      servicesTotals,
      extraDetailsTotals,
      customSectionsTotals,
      totalCost
    };
  }, [permitsState, servicesState, extraDetailsState, customSections, calculateSectionTotals]);

  const compileReportData = (groupId?: string) => {
    if (!selectedTrek) return null;
    const finalGroupId = groupId || uuidv4();
    const url = `${window.location.origin}/report/${finalGroupId}?groupSize=${groupSize}`;

    return {
      groupId: finalGroupId,
      reportUrl: url,
      trekId: selectedTrek.id,
      trekName: selectedTrek.name,
      groupSize,
      startDate,
      permits: permitsState,
      services: servicesState,
      extraDetails: extraDetailsState,
      customSections,
      totals: {
        permitsTotal: permitsTotals.total,
        servicesTotal: servicesTotals.total,
        extraDetailsTotal: extraDetailsTotals.total,
        customSectionsTotals: customSectionsTotals.map(s => ({name: s.name, total: s.total})),
        grandTotal: totalCost
      },
      serviceCharge,
    };
  }

  const handleSave = async () => {
    const reportData = compileReportData();
    if (!reportData) return;
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      setSavedReportUrl(reportData.reportUrl);

      toast({
        title: "Data Saved",
        description: "Your trek costing details have been saved.",
      });

    } catch(error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the report. Please try again.",
      });
    }
  };

  const handleUpdate = async () => {
    if (!initialData?.groupId) return;
    const reportData = compileReportData(initialData.groupId);
    if (!reportData) return;

    try {
      const response = await fetch(`/api/reports/${initialData.groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }
      
      toast({
        title: "Report Updated",
        description: "Your changes have been saved successfully.",
      });

    } catch(error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the report. Please try again.",
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Report link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleExportPDF = useCallback(async (userName?: string) => {
    if (!selectedTrek) return;
    
    const doc = new (jsPDF as any)();
    const groupId = initialData?.groupId || uuidv4();
    const qrCodeUrl = `${window.location.origin}/report/${groupId}?groupSize=${groupSize}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
    
    const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];

    const sectionsToExport = allSections.map(section => ({
        ...section,
        rows: section.rows.filter(row => row.total !== 0)
    })).filter(section => section.rows.length > 0);

    let yPos = 0;
    const pageTopMargin = 15;
    const pageLeftMargin = 14;
    const pageRightMargin = 14;

    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
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
    doc.text(`Group ID: ${groupId}`, pageLeftMargin, pageTopMargin + 15);
    
    doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, pageTopMargin, qrCodeSize, qrCodeSize);

    yPos = Math.max(pageTopMargin + 25, pageTopMargin + qrCodeSize) + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Group Details", pageLeftMargin, yPos);
    yPos += 7;
    doc.autoTable({
        startY: yPos,
        body: [
            ['Trek Name', selectedTrek.name || 'N/A'],
            ['Group Size', groupSize.toString()],
            ['Start Date', startDate ? format(startDate, 'PPP') : 'N/A'],
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
          formatCurrency(row.rate),
          row.no,
          row.times,
          formatCurrency(row.total)
      ]);
      const {subtotal, total} = calculateSectionTotals(section);

      body.push(['', 'Subtotal', '', '', '', formatCurrency(subtotal)]);
      if (section.discount > 0) {
        body.push(['', 'Discount', '', '', '', `- ${formatCurrency(section.discount)}`]);
      }
      body.push(['', 'Total', '', '', '', formatCurrency(total)]);

      doc.autoTable({
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
        return [`${section.name} Total`, formatCurrency(total)];
      });
      summaryData.push(['Grand Total', formatCurrency(grandTotal)]);
      
      doc.autoTable({
          startY: yPos,
          body: summaryData,
          theme: 'plain'
      });
    }

    addFooter();

    doc.save(`cost-report-${groupId.substring(0,8)}.pdf`);
    toast({ title: "Success", description: "PDF has been exported." });

  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast, calculateSectionTotals, initialData
  ]);
  
  const handleExportExcel = useCallback(() => {
     const wb = XLSX.utils.book_new();
     
     const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];
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

     XLSX.writeFile(wb, `cost-report-${uuidv4().substring(0,8)}.xlsx`);
     toast({ title: "Success", description: "Excel file has been exported." });
  }, [
    permitsState, servicesState, extraDetailsState, customSections, toast, calculateSectionTotals
  ]);

  return {
    steps,
    setSteps,
    currentStep,
    setCurrentStep,
    services,
    isLoading,
    selectedTrek,
    selectedTrekId,
    setSelectedTrekId,
    groupSize,
    setGroupSize,
    startDate,
    setStartDate,
    permitsState,
    servicesState,
    extraDetailsState,
    customSections,
    setCustomSections,
    permitsTotals,
    servicesTotals,
    extraDetailsTotals,
    customSectionsTotals,
    totalCost,
    handleRowChange,
    handleDiscountChange,
    addRow,
    removeRow,
    removeSection,
    handleSave,
    handleUpdate,
    savedReportUrl,
    isCopied,
    handleCopyToClipboard,
    handleExportPDF,
    handleExportExcel,
    usePax,
    handleSetUsePax,
    serviceCharge,
    setServiceCharge,
  };
}
