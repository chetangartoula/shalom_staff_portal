
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
  reportUrl?: string;
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
  groupId: crypto.randomUUID(),
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


export function useCostMatrix(treks: Trek[], initialData?: any) {
  const { toast } = useToast();
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [report, setReport] = useState<ReportState>(createInitialReportState());

  const [usePax, setUsePax] = useState<{ [key: string]: boolean }>({});

  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  useEffect(() => {
    if (initialData) {
        setIsLoading(true);
        const fullReport = {
            ...createInitialReportState(),
            ...initialData,
            groupId: initialData.groupId || crypto.randomUUID(), // Ensure groupId exists
            startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
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
        setIsLoading(false);
    }
  }, [initialData]);

  const selectedTrek = useMemo(
    () => treks?.find((trek) => trek.id === report.trekId),
    [report.trekId, treks]
  );
  
  const handleSetUsePax = useCallback((sectionId: string, value: boolean) => {
    setUsePax(prev => ({...prev, [sectionId]: value}));

    setReport(currentReport => {
        const updateRowPax = (row: CostRow) => {
            const newNo = value ? currentReport.groupSize : 1;
            return { ...row, no: newNo, total: (row.rate || 0) * newNo * (row.times || 0) };
        };

        const updateSection = (section: SectionState) => ({
            ...section,
            rows: section.rows.map(updateRowPax)
        });

        if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
            return { ...currentReport, [sectionId]: updateSection(currentReport[sectionId]) };
        } else {
            return {
                ...currentReport,
                customSections: currentReport.customSections.map(cs => cs.id === sectionId ? updateSection(cs) : cs)
            };
        }
    });
  }, [setReport]);

  const handleGroupSizeChange = useCallback((size: number) => {
    setReport(currentReport => {
      const newReport = { ...currentReport, groupSize: size };
      
      const updateSectionForPax = (section: SectionState) => {
        if (usePax[section.id]) {
          return {
            ...section,
            rows: section.rows.map(row => ({
              ...row,
              no: size,
              total: (row.rate || 0) * size * (row.times || 0)
            }))
          };
        }
        return section;
      };

      newReport.permits = updateSectionForPax(newReport.permits);
      newReport.services = updateSectionForPax(newReport.services);
      newReport.extraDetails = updateSectionForPax(newReport.extraDetails);
      newReport.customSections = newReport.customSections.map(updateSectionForPax);
      
      return newReport;
    });
  }, [usePax, setReport]);

  const handleTrekSelect = useCallback((trekId: string) => {
    const newSelectedTrek = treks?.find(t => t.id === trekId);
    if (!newSelectedTrek) return;

    setReport(prev => {
        const isPax = usePax['permits'] ?? false;
        const numberValue = isPax ? prev.groupSize : 1;
        const initialPermits = newSelectedTrek.permits.map(p => ({
            id: crypto.randomUUID(),
            description: p.name,
            rate: p.rate,
            no: numberValue,
            times: 1,
            total: p.rate * numberValue,
        }));

        const initialExtraDetails = [
            { id: crypto.randomUUID(), description: 'Satellite device', rate: 0, no: 1, times: 12, total: 0 },
            { id: crypto.randomUUID(), description: 'Adv less', rate: 0, no: 1, times: 0, total: 0 }
        ];

        return {
            ...prev,
            trekId: newSelectedTrek.id,
            trekName: newSelectedTrek.name,
            permits: { ...prev.permits, rows: initialPermits },
            extraDetails: { ...prev.extraDetails, rows: initialExtraDetails },
        };
    });
  }, [treks, usePax, setReport]);

  const handleDetailChange = useCallback((field: keyof ReportState, value: any) => {
      setReport(prev => ({...prev, [field]: value}));
  }, [setReport]);

  const handleSectionUpdate = useCallback((sectionId: string, updater: (s: SectionState) => SectionState) => {
    setReport(prevReport => {
        const newReport = {...prevReport};
        if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
            newReport[sectionId] = updater(newReport[sectionId]);
        } else {
            newReport.customSections = newReport.customSections.map(s => 
                s.id === sectionId ? updater(s) : s
            );
        }
        return newReport;
    });
  }, [setReport]);

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
    handleSectionUpdate(sectionId, (section) => ({ ...section, discount: value }));
  }, [handleSectionUpdate]);

  const addRow = useCallback((sectionId: string) => {
    const isPax = usePax[sectionId] ?? false;
    const groupSize = report.groupSize;
    const newRow: CostRow = { id: crypto.randomUUID(), description: "", rate: 0, no: isPax ? groupSize : 1, times: 1, total: 0 };
    handleSectionUpdate(sectionId, (prev) => ({...prev, rows: [...prev.rows, newRow]}));
  }, [handleSectionUpdate, usePax, report.groupSize]);

  const removeRow = useCallback((id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => ({...prev, rows: prev.rows.filter((row) => row.id !== id)}));
  }, [handleSectionUpdate]);

  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({...prev, customSections: prev.customSections.filter(s => s.id !== sectionId)}));
    setSteps(prev => prev.filter(s => s.id !== `custom_step_${sectionId}`));
  }, [setReport, setSteps]);
  
  const setCustomSections = useCallback((updater: (prev: SectionState[]) => SectionState[]) => {
      setReport(prev => ({...prev, customSections: updater(prev.customSections)}));
  }, [setReport]);

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
    setIsLoading(true);
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
    } finally {
        setIsLoading(false);
    }
  }, [getReportPayload, toast]);

  const handleUpdate = useCallback(async () => {
    setIsLoading(true);
    const payload = getReportPayload();
    try {
      const response = await fetch(`/api/reports/${payload.groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update report');
      setSavedReportUrl(payload.reportUrl);
      toast({ title: "Report Updated", description: "Your changes have been saved." });
    } catch(error) {
       toast({ variant: "destructive", title: "Error", description: "Could not update the report." });
    } finally {
        setIsLoading(false);
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
    setReport,
    steps,
    setSteps,
    currentStep,
    setCurrentStep,
    isLoading,
    setIsLoading,
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
    handleGroupSizeChange,
    totalCost
  };
}
