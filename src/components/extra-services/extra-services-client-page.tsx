"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, PlusSquare, Check, Copy, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/shadcn/breadcrumb";
import type { CostRow, SectionState } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handleExportPDF, handleExportExcel } from "@/lib/export";
import { CostTable } from "@/components/dashboard/cost-table";
import { FinalStep } from "@/components/steps/final-step";
import type { User } from '@/lib/auth';
import { postExtraInvoice } from '@/lib/api-service';

// Function to calculate extra service total based on the boolean flags
const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
  // Apply calculation based on boolean flags
  if (extraService.one_time) {
    // If one_time is true, calculate as rate (single occurrence regardless of other factors)
    return extraService.rate;
  } else if (extraService.per_person && extraService.per_day) {
    // If both per_person and per_day are true, calculate as rate * no * times
    return extraService.rate * no * times;
  } else if (extraService.per_person) {
    // If per_person is true, calculate as rate * no
    return extraService.rate * no;
  } else if (extraService.per_day) {
    // If per_day is true, calculate as rate * times
    return extraService.rate * times;
  } else {
    // If none of the above flags are true, calculate as rate * no * times (default)
    return extraService.rate * no * times;
  }
};

type ReportState = {
  groupId: string;
  groupName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  clientCommunicationMethod?: string;
  overallDiscountType: 'amount' | 'percentage';
  overallDiscountValue: number;
  overallDiscountRemarks: string;
};

const createInitialSectionState = (id: string, name: string): SectionState => ({
  id,
  name,
  rows: [],
  discountType: 'amount',
  discountValue: 0,
  discountRemarks: '',
});

const createInitialReportState = (groupId?: string): ReportState => ({
  groupId: groupId || crypto.randomUUID(),
  groupName: 'Extra Services',
  groupSize: 1,
  startDate: new Date(),
  permits: createInitialSectionState('permits', 'Permits & Food'),
  services: createInitialSectionState('services', 'Services'),
  extraDetails: createInitialSectionState('extraDetails', 'Extra Details'),
  customSections: [],
  serviceCharge: 10,
  clientCommunicationMethod: '',
  overallDiscountType: 'amount',
  overallDiscountValue: 0,
  overallDiscountRemarks: '',
});

const LoadingStep = () => (
  <div className="flex justify-center items-center h-96">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function ExtraServicesClientPage({ user, initialData, groupId: providedGroupId }: { user: User | null; initialData?: any; groupId?: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const groupId = providedGroupId || searchParams.get('groupId') || undefined;

  const [report, setReport] = useState<ReportState>(() => createInitialReportState(groupId));
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usePax, setUsePax] = useState<{ [key: string]: boolean }>({});
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [includeServiceChargeInPdf, setIncludeServiceChargeInPdf] = useState(true);

  useEffect(() => {
    if (initialData) {
      console.log('ExtraServicesClientPage: initialData changed', {
        groupId: initialData.groupId,
        hasPermits: !!initialData.permits,
        permitsCount: initialData.permits?.rows?.length || 0,
        hasServices: !!initialData.services,
        servicesCount: initialData.services?.rows?.length || 0
      });

      setReport(prev => {
        const fullReport = {
          ...createInitialReportState(initialData.groupId),
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          // Use the permits and services data from initialData with unique row IDs
          permits: initialData.permits ? {
            ...initialData.permits,
            rows: initialData.permits.rows.map((row: any) => ({ ...row, id: crypto.randomUUID() }))
          } : createInitialSectionState('permits', 'Permits & Food'),
          services: initialData.services ? {
            ...initialData.services,
            rows: initialData.services.rows.map((row: any) => ({ ...row, id: crypto.randomUUID() }))
          } : createInitialSectionState('services', 'Services'),
          extraDetails: initialData.extraDetails ? {
            ...initialData.extraDetails,
            rows: initialData.extraDetails.rows.map((row: any) => ({ ...row, id: crypto.randomUUID() }))
          } : createInitialSectionState('extraDetails', 'Extra Details'),
        };

        // If we already have a groupId and it matches, merge the data instead of replacing
        if (prev.groupId === initialData.groupId) {
          const updatedReport = {
            ...prev,
            // Update permits if they're provided in initialData
            permits: initialData.permits || prev.permits,
            // Update services if they're provided in initialData
            services: initialData.services || prev.services,
            // Update extraDetails if they're provided in initialData
            extraDetails: initialData.extraDetails || prev.extraDetails,
          };

          console.log('ExtraServicesClientPage: Merging data for same group', {
            permitsCount: updatedReport.permits?.rows?.length || 0,
            servicesCount: updatedReport.services?.rows?.length || 0
          });

          return updatedReport;
        }

        console.log('ExtraServicesClientPage: Using full report for new group');
        return fullReport;
      });
    }
  }, [initialData]);

  const calculateSectionTotals = (section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const discountAmount = section.discountType === 'percentage'
      ? (subtotal * (section.discountValue / 100))
      : section.discountValue;
    const total = subtotal - discountAmount;
    return { subtotal, total, discountAmount };
  };

  const subtotalBeforeOverallDiscount = (() => {
    const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
    return sections.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
  })();

  const overallDiscountAmount = (() => {
    return report.overallDiscountType === 'percentage'
      ? (subtotalBeforeOverallDiscount * (report.overallDiscountValue / 100))
      : report.overallDiscountValue;
  })();

  const totalCost = subtotalBeforeOverallDiscount - overallDiscountAmount;

  const handleSetUsePax = (sectionId: string, value: boolean) => {
    setUsePax(prev => ({ ...prev, [sectionId]: value }));

    setReport(currentReport => {
      const updateRowPax = (row: CostRow) => {
        const newNo = value ? currentReport.groupSize : 1;
        // Calculate total based on properties if it has boolean flags
        const total = (row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined)
          ? calculateExtraServiceTotal(row, newNo, row.times || 0)
          : (row.rate || 0) * newNo * (row.times || 0);
        return { ...row, no: newNo, total };
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
  };

  const handleGroupSizeChange = (size: number) => {
    setReport(currentReport => {
      const newReport = { ...currentReport, groupSize: size };

      const updateSectionForPax = (section: SectionState) => {
        if (usePax[section.id]) {
          return {
            ...section,
            rows: section.rows.map(row => {
              // Calculate total based on properties if it has boolean flags
              const total = (row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined)
                ? calculateExtraServiceTotal(row, size, row.times || 0)
                : (row.rate || 0) * size * (row.times || 0);
              return { ...row, no: size, total };
            })
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
  };

  const handleDetailChange = (field: keyof ReportState, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionUpdate = (sectionId: string, updater: (s: SectionState) => SectionState) => {
    setReport(prevReport => {
      const newReport = { ...prevReport };
      if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
        newReport[sectionId as 'permits' | 'services' | 'extraDetails'] = updater(newReport[sectionId as 'permits' | 'services' | 'extraDetails']);
      } else {
        newReport.customSections = newReport.customSections.map(s =>
          s.id === sectionId ? updater(s) : s
        );
      }
      return newReport;
    });
  };

  const handleRowChange = (id: string, field: keyof CostRow, value: any, sectionId: string) => {
    handleSectionUpdate(sectionId, (section) => ({
      ...section,
      rows: section.rows.map((row) => {
        if (row.id === id) {
          const newRow = { ...row, [field]: value };
          if (field === 'no' || field === 'rate' || field === 'times') {
            // Calculate total based on properties if it has boolean flags
            if (newRow.per_person !== undefined && newRow.per_day !== undefined && newRow.one_time !== undefined) {
              newRow.total = calculateExtraServiceTotal(newRow, newRow.no || 0, newRow.times || 0);
            } else {
              newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
            }
          }
          return newRow;
        }
        return row;
      })
    }));
  };

  const handleDiscountTypeChange = (sectionId: string, type: 'amount' | 'percentage') => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountType: type }));
  };

  const handleDiscountValueChange = (sectionId: string, value: number) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountValue: value }));
  };

  const handleDiscountRemarksChange = (sectionId: string, remarks: string) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountRemarks: remarks }));
  };

  // Handlers for overall discount
  const handleOverallDiscountTypeChange = (type: 'amount' | 'percentage') => {
    setReport(prev => ({ ...prev, overallDiscountType: type }));
  };

  const handleOverallDiscountValueChange = (value: number) => {
    setReport(prev => ({ ...prev, overallDiscountValue: value }));
  };

  const handleOverallDiscountRemarksChange = (remarks: string) => {
    setReport(prev => ({ ...prev, overallDiscountRemarks: remarks }));
  };

  const addRow = (sectionId: string) => {
    const isPax = usePax[sectionId] ?? false;
    const groupSize = report.groupSize;
    const newRow: CostRow = { id: crypto.randomUUID(), description: "", rate: 0, no: isPax ? groupSize : 1, times: 1, total: 0 };
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const removeRow = (id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: prev.rows.filter((row) => row.id !== id) }));
  };

  const removeSection = (sectionId: string) => {
    setReport(prev => ({ ...prev, customSections: prev.customSections.filter(s => s.id !== sectionId) }));
  };

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
      setReport(prev => ({ ...prev, customSections: prev.customSections.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s) }));
    } else {
      const newSectionId = crypto.randomUUID();
      const newSection: SectionState = {
        id: newSectionId,
        name: newSectionName,
        rows: [],
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      };
      setReport(prev => ({ ...prev, customSections: [...prev.customSections, newSection] }));
    }

    setIsSectionModalOpen(false);
    setEditingSection(null);
    setNewSectionName("");
  };

  const onExportPDF = async () => {
    try {
      await handleExportPDF({
        selectedTrek: {
          id: 'extra-services',
          name: 'Extra Services',
          description: 'Extra Services Invoice',
          times: 1,
          permits: []
        },
        report: {
          ...report,
          trekName: 'Extra Services',
          trekId: 'extra-services'
        },
        calculateSectionTotals,
        userName: user?.name,
        includeServiceCharge: includeServiceChargeInPdf,
      });
      toast({ title: "Success", description: "PDF has been exported." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export PDF." });
    }
  };

  const onExportExcel = async () => {
    try {
      await handleExportExcel({
        report: {
          ...report,
          trekName: 'Extra Services',
          trekId: 'extra-services'
        } as any,
        calculateSectionTotals,
      });
      toast({ title: "Success", description: "Excel file has been exported." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export Excel file." });
    }
  };

  const getReportPayload = () => {
    const url = `${window.location.origin}/report/${report.groupId}`;
    return { ...report, reportUrl: url };
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    const payload = getReportPayload();
    const url = `/api/reports`;
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save report`);
      }

      const result = await response.json();
      setSavedReportUrl(result.reportUrl);
      toast({ title: "Success!", description: "Report has been saved." });

      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // Transform permits data
      const permitsData = report.permits.rows.map(row => ({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times
      }));

      // Transform services data
      const servicesData = report.services.rows.map(row => ({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times
      }));

      // Transform extra services data
      // Group extra details by service_name to match the required structure
      const extraServicesMap = new Map();
      report.extraDetails.rows.forEach(row => {
        // Split the combined description to get service_name and param name
        const parts = row.description.split(' - ');
        const service_name = parts[0] || row.description; // If no separator, use the full description as service_name
        const param_name = parts[1] || row.description; // If no separator, use the full description as param name
        
        if (!extraServicesMap.has(service_name)) {
          extraServicesMap.set(service_name, {
            service_name: service_name,
            params: []
          });
        }
        extraServicesMap.get(service_name).params.push({
          name: param_name,
          rate: row.rate,
          numbers: row.no,
          times: row.times
        });
      });

      const extraServicesData = Array.from(extraServicesMap.values());

      // Prepare the payload structure for extra-invoice endpoint
      const payload = {
        package: parseInt(report.groupId),  // Package ID as number
        status: "draft",
        permits: permitsData,
        services: servicesData,
        extra_services: extraServicesData,
        service_discount: String(report.services.discountValue || 0),  // String format
        service_discount_type: report.services.discountType === 'percentage' ? 'percentage' : 'flat',
        service_discount_remarks: report.services.discountRemarks || "",
        extra_service_discount: String(report.extraDetails.discountValue || 0),  // String format
        extra_service_discount_type: report.extraDetails.discountType === 'percentage' ? 'percentage' : 'flat',
        extra_service_discount_remarks: report.extraDetails.discountRemarks || "",
        permit_discount: String(report.permits.discountValue || 0),  // String format
        permit_discount_type: report.permits.discountType === 'percentage' ? 'percentage' : 'flat',
        permit_discount_remarks: report.permits.discountRemarks || "",
        overall_discount: String(report.overallDiscountValue || 0),  // String format
        overall_discount_type: report.overallDiscountType === 'percentage' ? 'percentage' : 'flat',
        overall_discount_remarks: report.overallDiscountRemarks || "",
        service_charge: String(report.serviceCharge || 0)
      };

      // Make the API call to extra-invoice endpoint
      const response = await postExtraInvoice(report.groupId, payload);

      // Show success message
      toast({ title: "Success!", description: "Extra services invoice has been created successfully." });

      // Navigate to payments page for this group
      router.push(`/payments/${report.groupId}`);
    } catch (error) {
      console.error('Error creating extra invoice:', error);
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Traveler form link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const allCostingStepsMetadata = [
    { ...report.permits },
    { ...report.services },
    ...report.customSections,
    { id: 'final', name: 'Final Summary' }
  ];

  const renderStepContent = () => {
    if (isLoading) return <LoadingStep />;

    const stepIndex = currentStep;
    if (stepIndex < 0) return <LoadingStep />;

    const activeStepData = allCostingStepsMetadata[stepIndex];
    if (!activeStepData) return null;

    // Group details section removed for Extra Services page

    if (activeStepData.id === 'final') {
      return <FinalStep
        extraDetailsState={report.extraDetails}
        onRowChange={handleRowChange}
        onDiscountTypeChange={handleDiscountTypeChange}
        onDiscountValueChange={handleDiscountValueChange}
        onDiscountRemarksChange={handleDiscountRemarksChange}
        onAddRow={addRow}
        onRemoveRow={removeRow}
        onExportPDF={onExportPDF}
        onExportExcel={onExportExcel}
        totalCost={totalCost}
        subtotalBeforeOverallDiscount={subtotalBeforeOverallDiscount}
        overallDiscountType={report.overallDiscountType}
        overallDiscountValue={report.overallDiscountValue}
        overallDiscountAmount={overallDiscountAmount}
        overallDiscountRemarks={report.overallDiscountRemarks}
        onOverallDiscountTypeChange={handleOverallDiscountTypeChange}
        onOverallDiscountValueChange={handleOverallDiscountValueChange}
        onOverallDiscountRemarksChange={handleOverallDiscountRemarksChange}
        groupSize={report.groupSize}
        serviceCharge={report.serviceCharge}
        setServiceCharge={(value) => handleDetailChange('serviceCharge', value)}
        includeServiceChargeInPdf={includeServiceChargeInPdf}
        setIncludeServiceChargeInPdf={setIncludeServiceChargeInPdf}
        clientCommunicationMethod={report.clientCommunicationMethod}
        onClientCommunicationMethodChange={(method) => handleDetailChange('clientCommunicationMethod', method)}
        isSubmitting={isSaving}
        onSubmit={handleFinish}
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
          onDiscountRemarksChange={handleDiscountRemarksChange}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onEditSection={handleOpenEditSectionModal}
          onRemoveSection={removeSection}
        />
      );
    }

    return <LoadingStep />;
  };

  const breadcrumbItems = [
    ...allCostingStepsMetadata.map((s, i) => ({
      label: s.name,
      isCurrent: currentStep === i,
      stepIndex: i,
    }))
  ];

  const finalStepIndex = breadcrumbItems.length - 1;

  return (
    <div className="container py-6">
      {currentStep >= 0 && (
        <header className="mb-6 space-y-4">
          <div className="overflow-x-auto hide-scrollbar">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {item.isCurrent ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <button onClick={() => setCurrentStep(item.stepIndex)} className="transition-colors hover:text-foreground whitespace-nowrap">{item.label}</button>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{breadcrumbItems.find(b => b.isCurrent)?.label || 'Extra Services'}</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Creating invoice for extra services
              </p>
            </div>
            <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed self-start sm:self-center" onClick={handleOpenAddSectionModal}>
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

      {currentStep >= 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="outline" disabled={currentStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {savedReportUrl && (
              <div className="flex items-center gap-1 rounded-md bg-muted p-1 pr-2 text-sm w-full sm:w-auto">
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <a href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate" title={savedReportUrl}>
                  Traveler Form Link
                </a>
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              {currentStep === finalStepIndex ? (
                <Button onClick={handleFinish} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finish'}
                </Button>
              ) : (
                <Button onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}