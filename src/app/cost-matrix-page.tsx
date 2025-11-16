
"use client";

import { useState, useEffect, memo } from "react";
import { PlusSquare, Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { Stepper } from "@/components/ui/stepper";
import type { Trek } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

import { useCostMatrix, handleExportPDF, handleExportExcel } from "@/hooks/use-cost-matrix";
import { useToast } from "@/hooks/use-toast";

// Lazy-load all step components to reduce initial bundle size
const LoadingStep = () => (
  <div className="flex justify-center items-center h-96">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const SelectTrekStep = dynamic(() => import('@/components/steps/select-trek-step').then(mod => mod.SelectTrekStep), { loading: LoadingStep });
const GroupDetailsStep = dynamic(() => import('@/components/steps/group-details-step').then(mod => mod.GroupDetailsStep), { loading: LoadingStep });
const FinalStep = dynamic(() => import('@/components/steps/final-step').then(mod => mod.FinalStep), { loading: LoadingStep });
const CostTable = dynamic(() => import('@/components/cost-table').then(mod => mod.CostTable), { loading: LoadingStep });


interface TrekCostingPageProps {
  initialData?: any;
}

function TrekCostingPageComponent({ initialData }: TrekCostingPageProps) {
  const [isClient, setIsClient] = useState(false);
  const [treks, setTreks] = useState<Trek[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    async function fetchTreks() {
        try {
            const res = await fetch('/api/treks');
            const data = await res.json();
            setTreks(data.treks);
        } catch (error) {
            console.error("Failed to fetch treks", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load treks.' });
        }
    }
    fetchTreks();
    setIsClient(true);
  }, [toast]);

  const {
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
    totalCost,
    usePax,
    handleSetUsePax,
    calculateSectionTotals,
  } = useCostMatrix(treks, initialData);
  
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");

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
      setCustomSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s));
      const stepId = `custom_step_${editingSection.id}`;
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, name: newSectionName } : s));
    } else {
      const newSectionId = crypto.randomUUID();
      const newSection = { id: newSectionId, name: newSectionName, rows: [], discount: 0 };
      setCustomSections(prev => [...prev, newSection]);
  
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


  const handleFinish = async () => {
    if (initialData?.groupId) {
      await handleUpdate();
    } else {
      await handleSave();
    }
    router.push('/reports');
  };

  if (!isClient) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  const renderStepContent = () => {
    const step = steps[currentStep];

    if (isLoading || (treks.length === 0 && !initialData)) {
      return <LoadingStep />;
    }
    
    switch (step.id) {
      case '01':
        return treks.length > 0 ? (
          <SelectTrekStep
            treks={treks}
            selectedTrekId={report.trekId}
            onSelectTrek={handleTrekSelect}
          />
        ) : <LoadingStep />;

      case '02':
        return (
          <GroupDetailsStep
            groupSize={report.groupSize}
            onGroupSizeChange={(size) => handleDetailChange('groupSize', size)}
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
            onDiscountChange={handleDiscountChange}
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
            onDiscountChange={handleDiscountChange}
            onAddRow={addRow}
            onRemoveRow={removeRow}
          />
        );

      case '05':
        return (
          <FinalStep
            extraDetailsState={report.extraDetails}
            onRowChange={handleRowChange}
            onDiscountChange={handleDiscountChange}
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
                onDiscountChange={handleDiscountChange}
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
                    <Button variant="outline" className="border-dashed shrink-0">
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
            {renderStepContent()}
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
      <Toaster />
    </>
  );
}

export const TrekCostingPage = memo(TrekCostingPageComponent);
