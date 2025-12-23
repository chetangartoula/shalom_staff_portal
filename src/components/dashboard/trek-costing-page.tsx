
"use client";

import React, { useState, useEffect, memo, useCallback, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlusSquare, Check, Copy, Edit, Save, ArrowLeft, ArrowRight, FileDown } from "lucide-react";

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
} from "@/components/ui/shadcn/breadcrumb"

import type { Trek, CostRow, SectionState } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handleExportPDF, handleExportExcel } from "@/lib/export";
import type { User } from "@/lib/auth";
import { postGroupsAndPackage, updateGroupsAndPackage, updateExtraInvoice, postExtraInvoice } from '@/lib/api-service';

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
  clientCommunicationMethod?: string; // Added for client communication method
  overallDiscountType: 'amount' | 'percentage';
  overallDiscountValue: number;
  overallDiscountRemarks: string;
  isExtraInvoice?: boolean;
  isNew?: boolean;
};

const createInitialSectionState = (id: string, name: string): SectionState => ({
  id,
  name,
  rows: [],
  discountType: 'amount',
  discountValue: 0,
  discountRemarks: '', // Initialize discount remarks
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
  clientCommunicationMethod: '', // Initialize client communication method
  overallDiscountType: 'amount',
  overallDiscountValue: 0,
  overallDiscountRemarks: '',
  isExtraInvoice: false,
  isNew: false,
});

// Helper functions for group name generation
const getTrekShortName = (name: string): string => {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

const getCurrentTimestamp = (): string => {
  return Date.now().toString();
};

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
  onTrekSelect?: (trekId: string) => void;
  skipGroupDetails?: boolean;
  groupId?: string;
  isReadOnly?: boolean; // New prop to distinguish between cost estimator and cost matrix
}

function TrekCostingPageComponent({ initialData, treks = [], user = null, onTrekSelect, skipGroupDetails = false, groupId, isReadOnly = false }: TrekCostingPageProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [report, setReport] = useState<ReportState>(() => createInitialReportState(initialData?.groupId));
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(initialData?.reportUrl || null);
  const [isCopied, setIsCopied] = useState(false);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [includeServiceChargeInPdf, setIncludeServiceChargeInPdf] = useState(true);

  // Initialize from initialData and update when permits/services data arrives
  useEffect(() => {
    if (initialData && initialData.trekId) {
      console.log('TrekCostingPage: initialData changed', {
        trekId: initialData.trekId,
        hasPermits: !!initialData.permits,
        permitsCount: initialData.permits?.rows?.length || 0,
        hasServices: !!initialData.services,
        servicesCount: initialData.services?.rows?.length || 0
      });

      setReport(prev => {
        console.log('TrekCostingPage: Current report state', {
          trekId: prev.trekId,
          permitsCount: prev.permits?.rows?.length || 0,
          servicesCount: prev.services?.rows?.length || 0
        });

        // Create a new report with the initialData
        const fullReport = {
          ...createInitialReportState(initialData.groupId),
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        };

        // If groupName is empty or missing, generate it from the trek name
        if (!fullReport.groupName && initialData.trekId) {
          const trek = treks?.find(t => t.id === initialData.trekId);
          if (trek) {
            const shortName = getTrekShortName(trek.name);
            const timestamp = getCurrentTimestamp();
            fullReport.groupName = `${shortName}-${timestamp}`;
            // Also ensure trekName is set if missing
            if (!fullReport.trekName) {
              fullReport.trekName = trek.name;
            }
          }
        }

        // If we already have a trekId and it matches, merge the data instead of replacing
        if (prev.trekId === initialData.trekId) {
          const updatedReport = {
            ...prev,
            // Update permits if they're provided in initialData
            permits: initialData.permits || prev.permits,
            // Update services if they're provided in initialData
            services: initialData.services || prev.services,
            // Update extraDetails if they're provided in initialData
            extraDetails: initialData.extraDetails || prev.extraDetails,
          };

          console.log('TrekCostingPage: Merging data for same trek', {
            permitsCount: updatedReport.permits?.rows?.length || 0,
            servicesCount: updatedReport.services?.rows?.length || 0
          });

          return updatedReport;
        }

        console.log('TrekCostingPage: Using full report for new trek');
        // If it's a different trek or first load, replace everything
        return fullReport;
      });

      // Special handling for new extra invoices - start at trek selection if no trekId
      if (initialData.isNew && !initialData.trekId) {
        setCurrentStep(0);
      } else {
        // Only set step to 0 if we don't already have a currentStep set
        setCurrentStep(prev => prev === 0 && (report.trekId || initialData.trekId) ? prev : 0);
      }
    }
  }, [initialData, report.trekId]);

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

  const subtotalBeforeOverallDiscount = useMemo(() => {
    const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
    return sections.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
  }, [report, calculateSectionTotals]);

  const overallDiscountAmount = useMemo(() => {
    return report.overallDiscountType === 'percentage'
      ? (subtotalBeforeOverallDiscount * (report.overallDiscountValue / 100))
      : report.overallDiscountValue;
  }, [report.overallDiscountType, report.overallDiscountValue, subtotalBeforeOverallDiscount]);

  const totalCost = useMemo(() => {
    return subtotalBeforeOverallDiscount - overallDiscountAmount;
  }, [subtotalBeforeOverallDiscount, overallDiscountAmount]);

  const handleGroupSizeChange = useCallback((size: number) => {
    setReport(currentReport => {
      const newReport = { ...currentReport, groupSize: size };

      // Update all sections to use the new group size
      const updateSectionForPax = (section: SectionState) => {
        return {
          ...section,
          rows: section.rows.map(row => ({
            ...row,
            no: size,
            total: (row.rate || 0) * size * (row.times || 0)
          }))
        };
      };

      newReport.permits = updateSectionForPax(newReport.permits);
      newReport.services = updateSectionForPax(newReport.services);
      newReport.extraDetails = updateSectionForPax(newReport.extraDetails);
      newReport.customSections = newReport.customSections.map(updateSectionForPax);

      return newReport;
    });
  }, []);

  const handleDetailChange = useCallback((field: keyof ReportState, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSectionUpdate = useCallback((sectionId: string, updater: (s: SectionState) => SectionState) => {
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

  // Add a new handler for discount remarks
  const handleDiscountRemarksChange = useCallback((sectionId: string, remarks: string) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountRemarks: remarks }));
  }, [handleSectionUpdate]);

  // Handlers for overall discount
  const handleOverallDiscountTypeChange = useCallback((type: 'amount' | 'percentage') => {
    setReport(prev => ({ ...prev, overallDiscountType: type }));
  }, []);

  const handleOverallDiscountValueChange = useCallback((value: number) => {
    setReport(prev => ({ ...prev, overallDiscountValue: value }));
  }, []);

  const handleOverallDiscountRemarksChange = useCallback((remarks: string) => {
    setReport(prev => ({ ...prev, overallDiscountRemarks: remarks }));
  }, []);

  const handleTrekSelect = useCallback((trekId: string) => {
    const newSelectedTrek = treks?.find(t => t.id === trekId);
    if (!newSelectedTrek) return;

    // If we have a callback, use it to notify parent
    if (onTrekSelect) {
      onTrekSelect(trekId);
    }

    // Always update local state regardless of callback
    setReport(prev => {
      const initialPermits = newSelectedTrek.permits?.map(p => ({
        id: crypto.randomUUID(),
        description: p.name,
        rate: p.rate,
        no: prev.groupSize,
        times: 1,
        total: p.rate * prev.groupSize,
      })) || [];

      const initialExtraDetails = [
        { id: crypto.randomUUID(), description: 'Satellite device', rate: 0, no: prev.groupSize, times: 12, total: 0 },
        { id: crypto.randomUUID(), description: 'Adv less', rate: 0, no: prev.groupSize, times: 0, total: 0 }
      ];

      const trekShortName = getTrekShortName(newSelectedTrek.name);
      const timestamp = getCurrentTimestamp();
      const defaultGroupName = `${trekShortName}-${timestamp}`;

      return {
        ...prev,
        trekId: newSelectedTrek.id,
        trekName: newSelectedTrek.name,
        groupName: defaultGroupName,
        permits: { ...prev.permits, rows: initialPermits },
        extraDetails: { ...prev.extraDetails, rows: initialExtraDetails },
      };
    });
    // Set to step 0 to show Group Details (which is at index 0 in allCostingStepsMetadata)
    // When initialData exists, stepIndex = currentStep, so currentStep 0 = Group Details
    setCurrentStep(0);
  }, [treks, onTrekSelect]);

  const addRow = useCallback((sectionId: string) => {
    const newRow: CostRow = { id: crypto.randomUUID(), description: "", rate: 0, no: report.groupSize, times: 1, total: 0 };
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  }, [handleSectionUpdate, report.groupSize]);

  const removeRow = useCallback((id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: prev.rows.filter((row) => row.id !== id) }));
  }, [handleSectionUpdate]);

  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({ ...prev, customSections: prev.customSections.filter(s => s.id !== sectionId) }));
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
      setReport(prev => ({ ...prev, customSections: prev.customSections.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s) }));
    } else {
      const newSectionId = crypto.randomUUID();
      const newSection: SectionState = {
        id: newSectionId,
        name: newSectionName,
        rows: [],
        discountType: 'amount',
        discountValue: 0
      };
      setReport(prev => ({ ...prev, customSections: [...prev.customSections, newSection] }));
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
    } catch (err) {
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
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not export Excel file." });
    }
  }, [report, calculateSectionTotals, toast]);

  const handleCopyToClipboard = useCallback(() => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Traveler form link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [savedReportUrl, toast]);

  const getTransformedPayload = useCallback(() => {
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
    // Group extra details by description to match the required structure
    const extraServicesMap = new Map();
    report.extraDetails.rows.forEach(row => {
      if (!extraServicesMap.has(row.description)) {
        extraServicesMap.set(row.description, {
          service_name: row.description,
          params: []
        });
      }
      extraServicesMap.get(row.description).params.push({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times
      });
    });

    const extraServicesData = Array.from(extraServicesMap.values());

    return {
      package: {
        name: report.groupName || `${report.trekName} ${report.groupId.length > 4 ? report.groupId.substring(0, 4) : report.groupId}`,
        total_space: report.groupSize,
        start_date: report.startDate ? new Date(report.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: report.startDate ? new Date(report.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        trip: parseInt(report.trekId || '0')
      },
      status: "draft",
      permits: permitsData,
      services: servicesData,
      extra_services: extraServicesData,
      service_discount: String(report.services.discountValue || 0),
      service_discount_type: report.services.discountType === 'percentage' ? 'percentage' : 'flat',
      service_discount_remarks: report.services.discountRemarks || "",
      extra_service_discount: String(report.extraDetails.discountValue || 0),
      extra_service_discount_type: report.extraDetails.discountType === 'percentage' ? 'percentage' : 'flat',
      extra_service_discount_remarks: report.extraDetails.discountRemarks || "",
      permit_discount: String(report.permits.discountValue || 0),
      permit_discount_type: report.permits.discountType === 'percentage' ? 'percentage' : 'flat',
      permit_discount_remarks: report.permits.discountRemarks || "",
      overall_discount: String(report.overallDiscountValue || 0),
      overall_discount_type: report.overallDiscountType === 'percentage' ? 'percentage' : 'flat',
      overall_discount_remarks: report.overallDiscountRemarks || "",
      service_charge: String(report.serviceCharge || 0)
    };
  }, [report]);

  const handleSaveOrUpdate = useCallback(async (shouldNavigate: boolean = false) => {
    setIsSaving(true);
    const payload = getTransformedPayload();
    const isUpdate = !!initialData?.groupId;

    try {
      let response;
      if (isUpdate && !initialData.isNew) {
        if (report.isExtraInvoice) {
          response = await updateExtraInvoice(report.groupId, payload);
        } else {
          response = await updateGroupsAndPackage(report.groupId, payload);
        }
      } else {
        if (report.isExtraInvoice) {
          response = await postExtraInvoice(report.groupId, payload);
        } else {
          response = await postGroupsAndPackage(payload);
        }
      }

      toast({
        title: "Success!",
        description: `Report has been ${isUpdate && !initialData.isNew ? 'updated' : 'saved'} successfully.`
      });

      if (shouldNavigate) {
        router.push('/reports');
      }
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to save report"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [getTransformedPayload, initialData, report.groupId, router, toast]);

  const handleNextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const handleFinish = useCallback(async () => {
    await handleSaveOrUpdate(true);
  }, [handleSaveOrUpdate]);

  const allCostingStepsMetadata = useMemo(() => {
    const steps = [];

    // Only include Group Details if not skipping it
    if (!skipGroupDetails) {
      steps.push({ id: 'group-details', name: 'Group Details' });
    }

    steps.push(
      { ...report.permits },
      { ...report.services },
      ...report.customSections,
      { id: 'final', name: 'Final Summary' }
    );

    return steps;
  }, [report.permits, report.services, report.customSections, skipGroupDetails]);

  const renderStepContent = () => {
    if (isLoading) return <LoadingStep />;

    // Show trek selection step if we're on step 0 and don't have a trek selected yet
    if (currentStep === 0 && !report.trekId) {
      return <SelectTrekStep treks={treks || []} selectedTrekId={report.trekId} onSelectTrek={handleTrekSelect} />;
    }

    // After trek is selected, determine which step to show based on currentStep
    // When initialData exists or trek is selected: stepIndex = currentStep
    // When no initialData and no trek: we show trek selection above
    const stepIndex = currentStep;

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
        clientCommunicationMethod={report.clientCommunicationMethod}
        onClientCommunicationMethodChange={(method) => handleDetailChange('clientCommunicationMethod', method)}
      />;
    }

    if (activeStepData.id === 'final') {
      return (
        <FinalStep
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
          isRateReadOnly={true}
          hideAddRow={true}
        />
      );
    }

    if (activeStepData.id === 'permits' || activeStepData.id === 'services' || report.customSections.some(cs => cs.id === activeStepData.id)) {
      return (
        <CostTable
          section={report[activeStepData.id as keyof ReportState] as SectionState || report.customSections.find(cs => cs.id === activeStepData.id)!}
          isCustom={report.customSections.some(cs => cs.id === activeStepData.id)}
          isDescriptionEditable={activeStepData.id !== 'permits' && !isReadOnly}
          isReadOnly={isReadOnly}
          onRowChange={handleRowChange}
          onDiscountTypeChange={handleDiscountTypeChange}
          onDiscountValueChange={handleDiscountValueChange}
          onDiscountRemarksChange={handleDiscountRemarksChange}
          onAddRow={undefined}
          onRemoveRow={isReadOnly ? undefined : removeRow}
          onEditSection={isReadOnly ? undefined : handleOpenEditSectionModal}
          onRemoveSection={isReadOnly ? undefined : removeSection}
          isRateReadOnly={activeStepData.id === 'permits' || activeStepData.id === 'services' || activeStepData.id === 'extraDetails'}
          hideAddRow={true}
        />
      );
    }

    return <LoadingStep />;
  };

  const breadcrumbItems = useMemo(() => {
    // If no trek is selected, show only "Select Trek"
    if (!report.trekId) {
      return [{ label: "Select Trek", isCurrent: true, stepIndex: 0 }];
    }

    // Once trek is selected, show: Trek Name > Group Details > Permits > Services > ... > Summary
    const steps = [
      { label: selectedTrek?.name || 'Trek', isCurrent: false, stepIndex: -1 }, // Trek is not a real step, just a label
      ...allCostingStepsMetadata.map((s, i) => ({
        label: s.name,
        isCurrent: currentStep === i,
        stepIndex: i,
      }))
    ];

    return steps;
  }, [currentStep, selectedTrek, allCostingStepsMetadata, report.trekId]);

  const finalStepIndex = allCostingStepsMetadata.length - 1;


  return (
    <Suspense fallback={<LoadingStep />}>
      {report.trekId && (
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
                          <button
                            onClick={() => item.stepIndex >= 0 && setCurrentStep(item.stepIndex)}
                            className="transition-colors hover:text-foreground whitespace-nowrap"
                            disabled={item.stepIndex < 0}
                          >
                            {item.label}
                          </button>
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{breadcrumbItems.find(b => b.isCurrent)?.label || 'Cost Estimator'}</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {initialData?.groupId ? "Editing report for" : "Creating new report for"} <span className="font-semibold text-primary">{report.trekName}</span>
              </p>
            </div>
            {/* Remove Add Section button as requested */}
            {/* <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
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
            </Dialog> */}
          </div>
        </header>
      )}

      {renderStepContent()}

      {report.trekId && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            onClick={() => setCurrentStep(prev => prev - 1)}
            variant="outline"
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {savedReportUrl && (
              <div className="flex items-center gap-1 rounded-md bg-muted p-1 pr-2 text-sm w-full sm:w-auto">
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Link href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate" title={savedReportUrl}>
                  Traveler Form Link
                </Link>
              </div>
            )}

            {/* For the final step, show Export PDF, Export Excel, and Finish buttons */}
            {currentStep === finalStepIndex ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={onExportPDF} variant="outline" className="flex-1">
                  <FileDown className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={onExportExcel} variant="outline" className="flex-1">
                  <FileDown className="mr-2 h-4 w-4" /> Export Excel
                </Button>
                <Button onClick={handleFinish} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Finish
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                {/* For other steps, show Save and Next buttons */}
                {!isReadOnly && (
                  <Button onClick={() => handleSaveOrUpdate(false)} disabled={isSaving} className="flex-1">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                )}
                <Button onClick={handleNextStep} disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Suspense>
  );
}

export const TrekCostingPage = memo(TrekCostingPageComponent);


