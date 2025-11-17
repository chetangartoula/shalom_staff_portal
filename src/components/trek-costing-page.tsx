
"use client";

import { useState, useEffect, memo, useCallback, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlusSquare, Check, Copy, Edit, Trash2, Plus, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import type { Trek, CostRow, SectionState } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handleExportPDF, handleExportExcel } from "@/lib/export";
import type { User } from "@/lib/auth";

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
const CostTable = lazy(() => import('@/components/cost-table').then(mod => ({ default: mod.CostTable })));


interface TrekCostingPageProps {
  initialData?: any;
  treks?: Trek[];
  user?: User | null;
}

function TrekCostingPageComponent({ initialData, treks = [], user = null }: TrekCostingPageProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [report, setReport] = useState<ReportState>(() => createInitialReportState(initialData?.groupId));
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [usePax, setUsePax] = useState<{ [key: string]: boolean }>({});
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(initialData?.reportUrl || null);
  const [isCopied, setIsCopied] = useState(false);
  
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  
  useEffect(() => {
    if (initialData) {
        setIsLoading(true);
        const fullReport = {
            ...createInitialReportState(initialData.groupId),
            ...initialData,
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
            return { ...currentReport, [sectionId]: updateSection(currentReport[sectionId as keyof ReportState] as SectionState) };
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
  }, [treks, usePax, setReport]);

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
    setSteps(prev => prev.filter(s => s.id !== `custom_step_${sectionId}`));
  }, [setReport, setSteps]);

  const handleOpenAddSectionModal = () => {
    setEditingSection(null);
    setNewSectionName("");
    setIsSectionModalOpen(true);
  };
  
  const handleOpenEditSectionModal = (section: any) => {
    setEditingSection(section);
    setNewSectionName(section.name);
    setIsSectionModalOpen(true);
  };
  
  const handleSaveSection = () => {
    if (!newSectionName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Section name cannot be empty." });
      return;
    }
  
    if (editingSection) {
      setReport(prev => ({...prev, customSections: prev.customSections.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s)}));
      const stepId = `custom_step_${editingSection.id}`;
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, name: newSectionName } : s));
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
  
      const newStep = { id: `custom_step_${newSectionId}`, name: newSectionName };
      const finalStepIndex = steps.findIndex(s => s.name === "Final");
      const newSteps = [...steps.slice(0, finalStepIndex), newStep, steps[finalStepIndex]];
      setSteps(newSteps);
    }
    
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setNewSectionName("");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && !report.trekId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a trek to proceed.",
        });
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onExportPDF = async () => {
    if (!selectedTrek) return;
    try {
      await handleExportPDF({
        selectedTrek,
        report,
        calculateSectionTotals,
        userName: user?.name,
      });
      toast({ title: "Success", description: "PDF has been exported." });
    } catch(err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export PDF." });
    }
  }

  const onExportExcel = async () => {
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
  }

  const getReportPayload = useCallback(() => {
    const url = `${window.location.origin}/report/${report.groupId}`;
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

  const handleFinish = async () => {
    if (initialData?.groupId) {
      await handleUpdate();
    } else {
      await handleSave();
    }
    router.push('/reports');
  };
  
  const renderStepContent = () => {
    const step = steps[currentStep];

    if (isLoading) {
      return <LoadingStep />;
    }
    
    switch (step.id) {
      case '01':
        return (
          <SelectTrekStep
            treks={treks}
            selectedTrekId={report.trekId}
            onSelectTrek={handleTrekSelect}
          />
        );

      case '02':
        return (
          <GroupDetailsStep
            groupSize={report.groupSize}
            onGroupSizeChange={handleGroupSizeChange}
            startDate={report.startDate}
            onStartDateChange={(date) => handleDetailChange('startDate', date)}
          />
        );

      case '03':
        return (
          <CostTable
            section={report.permits}
            usePax={usePax[report.permits.id] || false}
            onSetUsePax={handleSetUsePax}
            onRowChange={handleRowChange}
            onDiscountTypeChange={handleDiscountTypeChange}
            onDiscountValueChange={handleDiscountValueChange}
            onAddRow={addRow}
            onRemoveRow={removeRow}
          />
        );

      case '04':
        return (
          <CostTable
            section={report.services}
            usePax={usePax[report.services.id] || false}
            onSetUsePax={handleSetUsePax}
            onRowChange={handleRowChange}
            onDiscountTypeChange={handleDiscountTypeChange}
            onDiscountValueChange={handleDiscountValueChange}
            onAddRow={addRow}
            onRemoveRow={removeRow}
          />
        );

      case '05':
        return (
          <FinalStep
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
          />
        );

      default:
        if (step.id.startsWith('custom_step_')) {
          const customSection = report.customSections.find(cs => `custom_step_${cs.id}` === step.id);
          if (customSection) {
            return (
              <CostTable
                section={customSection}
                usePax={usePax[customSection.id] || false}
                onSetUsePax={handleSetUsePax}
                isCustom
                isDescriptionEditable
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
        }
        return null;
    }
  };

  return (
    <>
      <Card className="w-full shadow-lg rounded-xl">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-between gap-x-8 gap-y-4 flex-wrap">
              <div className="flex-grow min-w-[300px]">
                <Stepper
                  steps={steps.map((s) => ({id: s.id, name: s.name, isCustom: s.id.startsWith('custom_step_')}))}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                />
              </div>
              <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-dashed shrink-0" onClick={handleOpenAddSectionModal}>
                        <PlusSquare /> Add Section
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
          </div>
          
          <div className="mt-8">
            <Suspense fallback={<LoadingStep />}>
              {renderStepContent()}
            </Suspense>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between items-center gap-4 flex-wrap">
        <Button onClick={prevStep} variant="outline" disabled={currentStep === 0}>
          Previous
        </Button>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {savedReportUrl && (
            <div className="flex items-center gap-1 rounded-md bg-muted p-2 text-sm">
                <Link href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-[120px] sm:max-w-xs" title={savedReportUrl}>
                  {savedReportUrl}
                </Link>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
          )}
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleFinish} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? 'Update' : 'Finish')}
            </Button>
          ) : (
            <Button onClick={nextStep}>
                Next
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export const TrekCostingPage = memo(TrekCostingPageComponent);

    