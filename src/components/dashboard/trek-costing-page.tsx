
"use client";

import React, { useState, useEffect, memo, useCallback, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlusSquare, Check, Copy, Edit, Save, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb"

import type { Trek, CostRow, SectionState } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handleExportPDF, handleExportExcel } from "@/lib/export";
import type { User } from "@/lib/auth";

type ReportState = {
  groupId: string;
  trekId: string | null;
  trekName: string;
  groupName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  reportUrl?: string;
};

const createInitialSectionState = (id: string, name: string): SectionState => ({
  id,
  name,
  rows: [],
  discountType: 'amount',
  discountValue: 0,
});

const createInitialReportState = (groupId?: string): ReportState => ({
  groupId: groupId || crypto.randomUUID(),
  trekId: null,
  trekName: '',
  groupName: '',
  groupSize: 1,
  startDate: new Date(),
  permits: createInitialSectionState('permits', 'Permits & Food'),
  services: createInitialSectionState('services', 'Services'),
  extraDetails: createInitialSectionState('extraDetails', 'Extra Details'),
  customSections: [],
  serviceCharge: 10,
});


const LoadingStep = () => (
  <div className="flex justify-center items-center h-96">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const SelectTrekStep = lazy(() => import('@/components/steps/select-trek-step').then(mod => ({ default: mod.SelectTrekStep })));
const GroupDetailsStep = lazy(() => import('@/components/steps/group-details-step').then(mod => ({ default: mod.GroupDetailsStep })));
const FinalStep = lazy(() => import('@/components/steps/final-step').then(mod => ({ default: mod.FinalStep })));
const CostTable = lazy(() => import('@/components/dashboard/cost-table').then(mod => ({ default: mod.CostTable })));


interface TrekCostingPageProps {
  initialData?: any;
  treks?: Trek[];
  user?: User | null;
}

function TrekCostingPageComponent({ initialData, treks = [], user = null }: TrekCostingPageProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [report, setReport] = useState<ReportState>(() => createInitialReportState(initialData?.groupId));
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(!!initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [usePax, setUsePax] = useState<{ [key: string]: boolean }>({});
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(initialData?.reportUrl || null);
  const [isCopied, setIsCopied] = useState(false);
  
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [includeServiceChargeInPdf, setIncludeServiceChargeInPdf] = useState(true);
  
  useEffect(() => {
    if (initialData) {
        const fullReport = {
            ...createInitialReportState(initialData.groupId),
            ...initialData,
            startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        };
        setReport(fullReport);

        if (initialData.trekId) {
            setCurrentStep(2); // Start from group details if editing
        }
        
        setIsLoading(false);
    }
  }, [initialData]);

  const selectedTrek = useMemo(
    () => treks?.find((trek) => trek.id === report.trekId),
    [report.trekId, treks]
  );
  
  const calculateSectionTotals = useCallback((section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const discountAmount = section.discountType === 'percentage'
        ? (subtotal * (section.discountValue / 100))
        : section.discountValue;
    const total = subtotal - discountAmount;
    return { subtotal, total, discountAmount };
  }, []);

  const totalCost = useMemo(() => {
    const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
    return sections.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
  }, [report, calculateSectionTotals]);

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
            return { ...currentReport, [sectionId]: updateSection(currentReport[sectionId as 'permits' | 'services' | 'extraDetails'] as SectionState) };
        } else {
            return {
                ...currentReport,
                customSections: currentReport.customSections.map(cs => cs.id === sectionId ? updateSection(cs) : cs)
            };
        }
    });
  }, []);

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
  }, [usePax]);

  const handleDetailChange = useCallback((field: keyof ReportState, value: any) => {
      setReport(prev => ({...prev, [field]: value}));
  }, []);

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
    setCurrentStep(1);
  }, [treks, usePax]);

  const handleSectionUpdate = useCallback((sectionId: string, updater: (s: SectionState) => SectionState) => {
    setReport(prevReport => {
        const newReport = {...prevReport};
        if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
            newReport[sectionId as 'permits' | 'services' | 'extraDetails'] = updater(newReport[sectionId as 'permits' | 'services' | 'extraDetails']);
        } else {
            newReport.customSections = newReport.customSections.map(s => 
                s.id === sectionId ? updater(s) : s
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
  
  const handleDiscountTypeChange = useCallback((sectionId: string, type: 'amount' | 'percentage') => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountType: type }));
  }, [handleSectionUpdate]);

  const handleDiscountValueChange = useCallback((sectionId: string, value: number) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountValue: value }));
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
  }, []);

  const handleOpenAddSectionModal = useCallback(() => {
    setEditingSection(null);
    setNewSectionName("");
    setIsSectionModalOpen(true);
  }, []);
  
  const handleOpenEditSectionModal = useCallback((section: any) => {
    setEditingSection(section);
    setNewSectionName(section.name);
    setIsSectionModalOpen(true);
  }, []);
  
  const handleSaveSection = useCallback(() => {
    if (!newSectionName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Section name cannot be empty." });
      return;
    }
  
    if (editingSection) {
      setReport(prev => ({...prev, customSections: prev.customSections.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s)}));
    } else {
      const newSectionId = crypto.randomUUID();
      const newSection: SectionState = { 
        id: newSectionId, 
        name: newSectionName, 
        rows: [], 
        discountType: 'amount', 
        discountValue: 0 
      };
      setReport(prev => ({...prev, customSections: [...prev.customSections, newSection]}));
    }
    
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setNewSectionName("");
  }, [newSectionName, editingSection, toast]);

  const onExportPDF = useCallback(async () => {
    if (!selectedTrek) return;
    try {
      await handleExportPDF({
        selectedTrek,
        report,
        calculateSectionTotals,
        userName: user?.name,
        includeServiceCharge: includeServiceChargeInPdf,
      });
      toast({ title: "Success", description: "PDF has been exported." });
    } catch(err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export PDF." });
    }
  }, [report, selectedTrek, calculateSectionTotals, user, includeServiceChargeInPdf, toast]);

  const onExportExcel = useCallback(async () => {
    try {
      await handleExportExcel({
        report,
        calculateSectionTotals,
      });
      toast({ title: "Success", description: "Excel file has been exported." });
    } catch(err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export Excel file." });
    }
  }, [report, calculateSectionTotals, toast]);

  const getReportPayload = useCallback(() => {
    const url = `${window.location.origin}/report/${report.groupId}`;
    return { ...report, reportUrl: url };
  }, [report]);

  const handleSaveOrUpdate = useCallback(async () => {
    setIsSaving(true);
    const payload = getReportPayload();
    const isUpdate = !!initialData?.groupId;
    const url = isUpdate ? `/api/reports/${payload.groupId}` : '/api/reports';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || `Failed to ${isUpdate ? 'update' : 'save'} report`);
      }

      setSavedReportUrl(payload.reportUrl);
      toast({ title: "Success!", description: `Report has been ${isUpdate ? 'updated' : 'saved'}.` });
      
      return true;
    } catch(error) {
       toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       return false;
    } finally {
        setIsSaving(false);
    }
  }, [getReportPayload, initialData, toast]);


  const handleCopyToClipboard = useCallback(() => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Traveler form link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [savedReportUrl, toast]);

  const handleFinish = useCallback(async () => {
    const success = await handleSaveOrUpdate();
    if (success) {
        router.push('/reports');
    }
  }, [handleSaveOrUpdate, router]);

  const allCostingStepsMetadata = useMemo(() => [
      { id: 'group-details', name: 'Group Details' },
      { ...report.permits },
      { ...report.services },
      ...report.customSections,
      { id: 'final', name: 'Final Summary' }
  ], [report.permits, report.services, report.customSections]);

  const renderStepContent = () => {
    if (isLoading) return <LoadingStep />;
    if (currentStep === 0 && !initialData) return <SelectTrekStep treks={treks} selectedTrekId={report.trekId} onSelectTrek={handleTrekSelect} />;
    
    // Adjust step index for rendering, since step 0 is trek selection
    const stepIndex = initialData ? currentStep : currentStep -1;
    if (stepIndex < 0) return <LoadingStep />;
    
    const activeStepData = allCostingStepsMetadata[stepIndex];
    if (!activeStepData) return null;

    if (activeStepData.id === 'group-details') {
        return <GroupDetailsStep
            groupName={report.groupName}
            onGroupNameChange={(name) => handleDetailChange('groupName', name)}
            groupSize={report.groupSize}
            onGroupSizeChange={handleGroupSizeChange}
            startDate={report.startDate}
            onStartDateChange={(date) => handleDetailChange('startDate', date)}
        />;
    }
    
    if (activeStepData.id === 'final') {
        return <FinalStep
            extraDetailsState={report.extraDetails}
            onRowChange={handleRowChange}
            onDiscountTypeChange={handleDiscountTypeChange}
            onDiscountValueChange={handleDiscountValueChange}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onExportPDF={onExportPDF}
            onExportExcel={onExportExcel}
            totalCost={totalCost}
            usePax={usePax[report.extraDetails.id] || false}
            onSetUsePax={handleSetUsePax}
            groupSize={report.groupSize}
            serviceCharge={report.serviceCharge}
            setServiceCharge={(value) => handleDetailChange('serviceCharge', value)}
            includeServiceChargeInPdf={includeServiceChargeInPdf}
            setIncludeServiceChargeInPdf={setIncludeServiceChargeInPdf}
        />;
    }

    if (activeStepData.id === 'permits' || activeStepData.id === 'services' || report.customSections.some(cs => cs.id === activeStepData.id)) {
        return (
            <CostTable
                section={report[activeStepData.id as keyof ReportState] as SectionState || report.customSections.find(cs => cs.id === activeStepData.id)!}
                usePax={usePax[activeStepData.id] || false}
                onSetUsePax={handleSetUsePax}
                isCustom={report.customSections.some(cs => cs.id === activeStepData.id)}
                isDescriptionEditable={activeStepData.id !== 'permits'}
                onRowChange={handleRowChange}
                onDiscountTypeChange={handleDiscountTypeChange}
                onDiscountValueChange={handleDiscountValueChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onEditSection={handleOpenEditSectionModal}
                onRemoveSection={removeSection}
            />
        );
    }
    
    return <LoadingStep />;
  };
  
  const breadcrumbItems = useMemo(() => {
    if (currentStep === 0 && !initialData) return [{ label: "Select Trek", isCurrent: true, stepIndex: 0 }];

    const steps = [
        { label: selectedTrek?.name || 'Trek', isCurrent: false, stepIndex: 0 },
        ...allCostingStepsMetadata.map((s, i) => ({
            label: s.name,
            isCurrent: (initialData ? currentStep : currentStep - 1) === i,
            stepIndex: initialData ? i : i + 1,
        }))
    ];

    if (initialData) {
        steps.shift(); // Remove the "Trek" step if we are editing
    }

    return steps;
  }, [currentStep, selectedTrek, allCostingStepsMetadata, initialData]);

  const finalStepIndex = breadcrumbItems.length - 1;


  return (
    <Suspense fallback={<LoadingStep />}>
      { (currentStep > 0 || initialData) && (
         <header className="mb-6 space-y-4">
             <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <BreadcrumbItem>
                                {item.isCurrent ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <button onClick={() => setCurrentStep(item.stepIndex)} className="transition-colors hover:text-foreground">{item.label}</button>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{breadcrumbItems.find(b => b.isCurrent)?.label || 'Cost Estimator'}</h1>
                  <p className="text-muted-foreground">
                    {initialData?.groupId ? "Editing report for" : "Creating new report for"} <span className="font-semibold text-primary">{report.trekName}</span>
                  </p>
                </div>
                 <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-dashed" onClick={handleOpenAddSectionModal}>
                            <PlusSquare className="mr-2 h-4 w-4" /> Add Section
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                          <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                          <DialogDescription>
                            Create a new custom section to add more items to your cost calculation.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="section-name" className="text-right">Name</Label>
                              <Input id="section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="col-span-3" />
                          </div>
                      </div>
                      <DialogFooter>
                          <Button onClick={handleSaveSection}>Save Section</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
             </div>
         </header>
      )}

      {renderStepContent()}
      
      { (currentStep > 0 || initialData) && (
        <div className="mt-8 flex justify-between items-center gap-4 flex-wrap">
            <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="outline" disabled={initialData ? currentStep === 0 : currentStep <= 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
              {savedReportUrl && (
                <div className="flex items-center gap-1 rounded-md bg-muted p-1 pr-2 text-sm">
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                      {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Link href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-[120px] sm:max-w-xs" title={savedReportUrl}>
                      Traveler Form Link
                    </Link>
                </div>
              )}
              
              <Button onClick={handleSaveOrUpdate} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Save
              </Button>

              {currentStep === finalStepIndex ? (
                <Button onClick={handleFinish} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Finish & Close
                </Button>
              ) : (
                <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                    Next
                </Button>
              )}
            </div>
        </div>
      )}
    </Suspense>
  );
}

export const TrekCostingPage = memo(TrekCostingPageComponent);
