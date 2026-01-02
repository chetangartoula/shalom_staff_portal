"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, PlusSquare, Check, Copy, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb";
import type { CostRow, SectionState, Trek } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { handleExportPDF, handleExportExcel } from "@/lib/export";
import { CostTable } from "@/components/dashboard/cost-table";
import { FinalStep } from "@/components/steps/final-step";
import { GroupDetailsStep } from "@/components/steps/group-details-step";
import { SelectTrekStep } from "@/components/steps/select-trek-step";
import type { User } from '@/lib/auth';
import { postExtraInvoice } from '@/lib/api-service';
import { usePermits } from '@/hooks/use-permits';
import { useServices } from '@/hooks/use-services';
import { useAllExtraServices } from '@/hooks/use-all-extra-services';
import { useAllAccommodations } from '@/hooks/use-all-accommodations';
import { useAllTransportations } from '@/hooks/use-all-transportations';
import { useTrips } from '@/hooks/use-trips';

const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
  const rate = Number(extraService.rate) || 0;
  
  if (extraService.one_time) {
    return rate;
  } else if (extraService.per_person && extraService.per_day) {
    // If both per_person and per_day are true, calculate as rate * no * times
    return rate * no * times;
  } else if (extraService.per_person) {
    // If per_person is true, calculate as rate * no
    return rate * no;
  } else if (extraService.per_day) {
    // If per_day is true, calculate as rate * times
    return rate * times;
  } else {
    // If none of the above flags are true, calculate as rate * no * times (default)
    return rate * no * times;
  }
};

// Helper function to calculate row quantity based on max_capacity and per_person
const calculateRowQuantity = (item: any, groupSize: number): number => {
  if (item.one_time) {
    // If one_time is true, quantity is always 1 regardless of other factors
    return 1;
  }
  
  if (item.max_capacity && item.max_capacity > 0) {
    // Calculate quantity based on max_capacity
    return Math.ceil(groupSize / item.max_capacity);
  }

  if (item.per_person) {
    return groupSize;
  }

  return 1;
};

type ReportState = {
  groupId: string;
  trekId: string | null;
  trekName: string;
  groupName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  accommodation: SectionState;
  transportation: SectionState;
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

const createInitialReportState = (groupId?: string): ReportState => ({
  groupId: groupId || crypto.randomUUID(),
  trekId: null,
  trekName: '',
  groupName: 'Extra Services',
  groupSize: 1,
  startDate: new Date(),
  permits: createInitialSectionState('permits', 'Permits & Documents'),
  services: createInitialSectionState('services', 'Services'),
  accommodation: createInitialSectionState('accommodation', 'Accommodation'),
  transportation: createInitialSectionState('transportation', 'Transportation'),
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


  const [includeServiceChargeInPdf, setIncludeServiceChargeInPdf] = useState(true);

  // Fetch trips data to get trek information
  const { data: trips, isLoading: isLoadingTrips } = useTrips();
  
  // Fetch data for each section to populate the add dialogs
  const { data: allPermits, isLoading: isLoadingAllPermits } = usePermits(report.trekId || '');
  const { data: allServices, isLoading: isLoadingAllServices } = useServices(report.trekId || '');
  const { data: allExtraServices, isLoading: isLoadingAllExtraServices } = useAllExtraServices(report.trekId || '');
  const { data: allAccommodations, isLoading: isLoadingAllAccommodations } = useAllAccommodations(report.trekId || '');
  const { data: allTransportations, isLoading: isLoadingAllTransportations } = useAllTransportations(report.trekId || '');

  // Handle trek selection
  const handleTrekSelect = (trekId: string) => {
    const selectedTrek = trips?.find(t => t.id === trekId);
    if (selectedTrek) {
      setReport(prev => {
        // Auto-generate group name based on trek name
        const shortName = getTrekShortName(selectedTrek.name);
        const timestamp = getCurrentTimestamp();
        const defaultGroupName = `${shortName}-${timestamp}`;
        
        return {
          ...prev,
          trekId: selectedTrek.id,
          trekName: selectedTrek.name,
          groupName: defaultGroupName,
        };
      });
      
      // Move to the next step (Group Details)
      setCurrentStep(1);
    }
  };

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
          trekId: initialData.trekId || null,
          trekName: initialData.trekName || '',
          // Auto-generate group name if not provided and trek name is available
          groupName: initialData.groupName || 
            (initialData.trekName ? 
              `${getTrekShortName(initialData.trekName)}-${getCurrentTimestamp()}` : 
              'Extra Services'),
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
          // Use the permits and services data from initialData with unique row IDs and proper calculations
          permits: initialData.permits ? {
            ...initialData.permits,
            rows: initialData.permits.rows.map((row: any) => {
              // Calculate no based on max_capacity and per_person
              const calculatedNo = calculateRowQuantity(row, initialData.groupSize || 1);
              // Calculate times based on per_day and one_time flags
              let calculatedTimes = 1;
              if (row.per_day) {
                calculatedTimes = initialData.package?.times || 1;
              } else if (row.one_time) {
                calculatedTimes = 1;
              } else {
                // For items that are neither per_day nor one_time, use the original times value
                calculatedTimes = row.times || 1;
              }
              return {
                ...row,
                id: crypto.randomUUID(),
                no: calculatedNo,
                times: calculatedTimes,
                total: calculateExtraServiceTotal(row, calculatedNo, calculatedTimes),
                description: row.description || (row as any).name || '',
                // Ensure boolean flags and max_capacity are properly handled
                per_person: row.per_person,
                per_day: row.per_day,
                one_time: row.one_time,
                max_capacity: row.max_capacity,
              };
            })
          } : createInitialSectionState('permits', 'Permits & Documents'),
          services: initialData.services ? {
            ...initialData.services,
            rows: initialData.services.rows.map((row: any) => {
              // Calculate no based on max_capacity and per_person
              const calculatedNo = calculateRowQuantity(row, initialData.groupSize || 1);
              // Calculate times based on per_day and one_time flags
              let calculatedTimes = 1;
              if (row.per_day) {
                calculatedTimes = initialData.package?.times || 1;
              } else if (row.one_time) {
                calculatedTimes = 1;
              } else {
                // For items that are neither per_day nor one_time, use the original times value
                calculatedTimes = row.times || 1;
              }
              return {
                ...row,
                id: crypto.randomUUID(),
                no: calculatedNo,
                times: calculatedTimes,
                total: calculateExtraServiceTotal(row, calculatedNo, calculatedTimes),
                description: row.description || (row as any).name || '',
                // Ensure boolean flags and max_capacity are properly handled
                per_person: row.per_person,
                per_day: row.per_day,
                one_time: row.one_time,
                max_capacity: row.max_capacity,
              };
            })
          } : createInitialSectionState('services', 'Services'),
          accommodation: initialData.accommodation ? {
            ...initialData.accommodation,
            rows: initialData.accommodation.rows.map((row: any) => {
              // Calculate no based on max_capacity and per_person
              const calculatedNo = calculateRowQuantity(row, initialData.groupSize || 1);
              // Calculate times based on per_day and one_time flags
              let calculatedTimes = 1;
              if (row.per_day) {
                calculatedTimes = initialData.package?.times || 1;
              } else if (row.one_time) {
                calculatedTimes = 1;
              } else {
                // For items that are neither per_day nor one_time, use the original times value
                calculatedTimes = row.times || 1;
              }
              return {
                ...row,
                id: crypto.randomUUID(),
                no: calculatedNo,
                times: calculatedTimes,
                total: calculateExtraServiceTotal(row, calculatedNo, calculatedTimes),
                description: row.description || (row as any).name || '',
                // Ensure boolean flags and max_capacity are properly handled
                per_person: row.per_person,
                per_day: row.per_day,
                one_time: row.one_time,
                max_capacity: row.max_capacity,
              };
            })
          } : createInitialSectionState('accommodation', 'Accommodation'),
          transportation: initialData.transportation ? {
            ...initialData.transportation,
            rows: initialData.transportation.rows.map((row: any) => {
              // Calculate no based on max_capacity and per_person
              const calculatedNo = calculateRowQuantity(row, initialData.groupSize || 1);
              // Calculate times based on per_day and one_time flags
              let calculatedTimes = 1;
              if (row.per_day) {
                calculatedTimes = initialData.package?.times || 1;
              } else if (row.one_time) {
                calculatedTimes = 1;
              } else {
                // For items that are neither per_day nor one_time, use the original times value
                calculatedTimes = row.times || 1;
              }
              return {
                ...row,
                id: crypto.randomUUID(),
                no: calculatedNo,
                times: calculatedTimes,
                total: calculateExtraServiceTotal(row, calculatedNo, calculatedTimes),
                description: row.description || (row as any).name || '',
                // Ensure boolean flags and max_capacity are properly handled
                per_person: row.per_person,
                per_day: row.per_day,
                one_time: row.one_time,
                max_capacity: row.max_capacity,
              };
            })
          } : createInitialSectionState('transportation', 'Transportation'),
          extraDetails: initialData.extraDetails ? {
            ...initialData.extraDetails,
            rows: initialData.extraDetails.rows.map((row: any) => {
              const calculatedNo = calculateRowQuantity(row, initialData.groupSize || 1);
              let calculatedTimes = 1;
              if (row.per_day) {
                calculatedTimes = initialData.package?.times || 1;
              } else if (row.one_time) {
                calculatedTimes = 1;
              } else {
                calculatedTimes = row.times || 1;
              }
              return {
                ...row,
                id: crypto.randomUUID(),
                no: calculatedNo,
                times: calculatedTimes,
                total: calculateExtraServiceTotal(row, calculatedNo, calculatedTimes),
                description: row.description || (row as any).name || '',
                per_person: row.per_person,
                per_day: row.per_day,
                one_time: row.one_time,
                max_capacity: row.max_capacity,
              };
            })
          } : createInitialSectionState('extraDetails', 'Extra Details'),
        };

        if (prev.groupId === initialData.groupId) {
          const updatedReport = {
            ...prev,
            permits: initialData.permits || prev.permits,
            services: initialData.services || prev.services,
            accommodation: initialData.accommodation || prev.accommodation,
            transportation: initialData.transportation || prev.transportation,
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
      
      
      if (initialData.trekId) {
        setCurrentStep(1);
      } else {
        setCurrentStep(0);
      }
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
        // Calculate quantity based on max_capacity and per_person
        const newNo = calculateRowQuantity(row, value ? currentReport.groupSize : 1);
        // Calculate times based on per_day and one_time flags using package.times
        let newTimes = 1;
        if (row.per_day) {
          newTimes = initialData?.package?.times || 1;
        } else if (row.one_time) {
          newTimes = 1;
        } else {
          // For items that are neither per_day nor one_time, use the original times value
          newTimes = row.times || 1;
        }
        // Calculate total based on properties if it has boolean flags
        const total = (row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined)
          ? calculateExtraServiceTotal(row, newNo, newTimes)
          : (row.rate || 0) * newNo * newTimes;
        return { 
          ...row, 
          no: newNo, 
          times: newTimes,
          total, 
          description: row.description || (row as any).name || '' 
        };
      };

      const updateSection = (section: SectionState) => ({
        ...section,
        rows: section.rows.map(updateRowPax)
      });

      if (sectionId === 'permits') {
        return { ...currentReport, permits: updateSection(currentReport.permits) };
      } else if (sectionId === 'services') {
        return { ...currentReport, services: updateSection(currentReport.services) };
      } else if (sectionId === 'accommodation') {
        return { ...currentReport, accommodation: updateSection(currentReport.accommodation) };
      } else if (sectionId === 'transportation') {
        return { ...currentReport, transportation: updateSection(currentReport.transportation) };
      } else if (sectionId === 'extraDetails') {
        return { ...currentReport, extraDetails: updateSection(currentReport.extraDetails) };
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
              // Calculate quantity based on max_capacity and per_person
              const newNo = calculateRowQuantity(row, size);
              // Calculate times based on per_day and one_time flags
              let newTimes = 1;
              if (row.per_day) {
                newTimes = initialData?.package?.times || 1;
              } else if (row.one_time) {
                newTimes = 1;
              } else {
                // For items that are neither per_day nor one_time, use the original times value
                newTimes = row.times || 1;
              }
              // Calculate total based on properties if it has boolean flags
              const total = (row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined)
                ? calculateExtraServiceTotal(row, newNo, newTimes)
                : (row.rate || 0) * newNo * newTimes;
              return { 
                ...row, 
                no: newNo, 
                times: newTimes,
                total, 
                description: row.description || (row as any).name || '' 
              };
            })
          };
        }
        return section;
      };

      newReport.permits = updateSectionForPax(newReport.permits);
      newReport.services = updateSectionForPax(newReport.services);
      newReport.accommodation = updateSectionForPax(newReport.accommodation);
      newReport.transportation = updateSectionForPax(newReport.transportation);
      newReport.extraDetails = updateSectionForPax(newReport.extraDetails);
      newReport.customSections = newReport.customSections.map(updateSectionForPax);

      return newReport;
    });
  };

  const handleDetailChange = (field: keyof ReportState, value: any) => {
    setReport(prev => {
      let updatedReport = { ...prev, [field]: value };
      
      // If trekId or trekName is being updated, auto-generate the group name
      if (field === 'trekId' && value) {
        // Find the trek name from the available data
        const trekName = initialData?.trekName || '';
        if (trekName && (!prev.groupName || prev.groupName === 'Extra Services')) { // Only auto-generate if groupName is default or not set
          const shortName = getTrekShortName(trekName);
          const timestamp = getCurrentTimestamp();
          updatedReport = { ...updatedReport, groupName: `${shortName}-${timestamp}` };
        }
      } else if (field === 'trekName' && value) {
        if (!prev.groupName || prev.groupName === 'Extra Services') { // Only auto-generate if groupName is default or not set
          const shortName = getTrekShortName(value);
          const timestamp = getCurrentTimestamp();
          updatedReport = { ...updatedReport, groupName: `${shortName}-${timestamp}` };
        }
      }
      
      return updatedReport;
    });
  };

  const handleSectionUpdate = (sectionId: string, updater: (s: SectionState) => SectionState) => {
    setReport(prevReport => {
      const newReport = { ...prevReport };
      if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'accommodation' || sectionId === 'transportation' || sectionId === 'extraDetails') {
        if (sectionId === 'permits') {
          newReport.permits = updater(newReport.permits);
        } else if (sectionId === 'services') {
          newReport.services = updater(newReport.services);
        } else if (sectionId === 'accommodation') {
          newReport.accommodation = updater(newReport.accommodation);
        } else if (sectionId === 'transportation') {
          newReport.transportation = updater(newReport.transportation);
        } else if (sectionId === 'extraDetails') {
          newReport.extraDetails = updater(newReport.extraDetails);
        }
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
          const updatedRow = { ...row, [field]: value };
          
          // Recalculate no based on the updated flags
          let newNo = calculateRowQuantity(updatedRow, report.groupSize);
          
          // Calculate times based on per_day and one_time flags using package.times
          let newTimes = 1;
          if (updatedRow.per_day) {
            newTimes = initialData?.package?.times || 1;
          } else if (updatedRow.one_time) {
            newTimes = 1;
          } else {
            // For items that are neither per_day nor one_time, use the original times value
            newTimes = updatedRow.times || 1;
          }
          
          // Calculate total based on properties if it has boolean flags
          if (field === 'no' || field === 'rate' || field === 'times' || 
              field === 'per_person' || field === 'per_day' || field === 'one_time' || field === 'max_capacity') {
            if (updatedRow.per_person !== undefined && updatedRow.per_day !== undefined && updatedRow.one_time !== undefined) {
              updatedRow.total = calculateExtraServiceTotal(updatedRow, newNo || 0, newTimes || 0);
            } else {
              updatedRow.total = (updatedRow.rate || 0) * (newNo || 0) * (newTimes || 0);
            }
          }
          
          return { ...updatedRow, no: newNo, times: newTimes };
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
    const newRow: CostRow = { 
      id: crypto.randomUUID(), 
      description: "", 
      rate: 0, 
      no: isPax ? groupSize : 1, 
      times: 1, // Default to 1, will be recalculated based on flags
      total: 0,
      per_person: false, // Default to false
      per_day: false,    // Default to false
      one_time: true,    // Default to true
      max_capacity: undefined // Default to undefined
    };
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const removeRow = (id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: prev.rows.filter((row) => row.id !== id) }));
  };

  const removeSection = (sectionId: string) => {
    setReport(prev => ({ ...prev, customSections: prev.customSections.filter(s => s.id !== sectionId) }));
  };

  // Add functions for each section type
  const handleAddPermit = (item: any) => {
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: item.name || item.description || 'New Permit',
      rate: item.rate || 0,
      no: item.per_person ? report.groupSize : 1,
      times: item.per_day ? (initialData?.package?.times || 1) : 1,
      total: item.rate || 0,
      per_person: item.per_person,
      per_day: item.per_day,
      one_time: item.one_time,
      is_editable: item.is_editable !== undefined ? item.is_editable : true,
      max_capacity: item.max_capacity,
      from_place: item.from_place,
      to_place: item.to_place
    };
    handleSectionUpdate('permits', (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddService = (item: any) => {
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: item.name || item.description || 'New Service',
      rate: item.rate || 0,
      no: item.per_person ? report.groupSize : 1,
      times: item.per_day ? (initialData?.package?.times || 1) : 1,
      total: item.rate || 0,
      per_person: item.per_person,
      per_day: item.per_day,
      one_time: item.one_time,
      is_editable: item.is_editable !== undefined ? item.is_editable : true,
      max_capacity: item.max_capacity,
      from_place: item.from_place,
      to_place: item.to_place
    };
    handleSectionUpdate('services', (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddAccommodation = (item: any) => {
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: item.name || item.description || 'New Accommodation',
      rate: item.rate || 0,
      no: item.per_person ? report.groupSize : 1,
      times: item.per_day ? (initialData?.package?.times || 1) : 1,
      total: item.rate || 0,
      per_person: item.per_person,
      per_day: item.per_day,
      one_time: item.one_time,
      is_editable: item.is_editable !== undefined ? item.is_editable : true,
      max_capacity: item.max_capacity,
      from_place: item.from_place,
      to_place: item.to_place
    };
    handleSectionUpdate('accommodation', (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddTransportation = (item: any) => {
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: item.name || item.description || 'New Transportation',
      rate: item.rate || 0,
      no: item.per_person ? report.groupSize : 1,
      times: item.per_day ? (initialData?.package?.times || 1) : 1,
      total: item.rate || 0,
      per_person: item.per_person,
      per_day: item.per_day,
      one_time: item.one_time,
      is_editable: item.is_editable !== undefined ? item.is_editable : true,
      max_capacity: item.max_capacity,
      from_place: item.from_place,
      to_place: item.to_place
    };
    handleSectionUpdate('transportation', (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddExtraService = (item: any) => {
    // For extra services, the description might be combined from service_name and param name
    const combinedDescription = item.description || `${item.service_name || item.name || 'New Extra Service'} - ${item.name || item.description || 'Item'}`;
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: combinedDescription,
      rate: item.rate || 0,
      no: item.per_person ? report.groupSize : 1,
      times: item.per_day ? (initialData?.package?.times || 1) : 1,
      total: item.rate || 0,
      per_person: item.per_person,
      per_day: item.per_day,
      one_time: item.one_time,
      is_editable: item.is_editable !== undefined ? item.is_editable : true,
      max_capacity: item.max_capacity,
      from_place: item.from_place,
      to_place: item.to_place
    };
    handleSectionUpdate('extraDetails', (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
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
        times: row.times,
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        max_capacity: row.max_capacity || null
      }));

      // Transform services data
      const servicesData = report.services.rows.map(row => ({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times,
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        max_capacity: row.max_capacity || null
      }));

      // Transform accommodation data
      const accommodationData = report.accommodation.rows.map(row => ({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times,
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        max_capacity: row.max_capacity || null
      }));

      // Transform transportation data
      const transportationData = report.transportation.rows.map(row => ({
        name: row.description,
        rate: row.rate,
        numbers: row.no,
        times: row.times,
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        max_capacity: row.max_capacity || null
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
          times: row.times,
          per_person: row.per_person || false,
          per_day: row.per_day || false,
          one_time: row.one_time || false,
          max_capacity: row.max_capacity || null
        });
      });

      const extraServicesData = Array.from(extraServicesMap.values());

      // Prepare the payload structure for extra-invoice endpoint
      const payload = {
        package: parseInt(report.groupId),  // Package ID as number
        status: "draft",
        permits: permitsData,
        services: servicesData,
        accommodation: accommodationData,
        transportation: transportationData,
        extra_services: extraServicesData,
        service_discount: String(report.services.discountValue || 0),  // String format
        service_discount_type: report.services.discountType === 'percentage' ? 'percentage' : 'flat',
        service_discount_remarks: report.services.discountRemarks || "",
        accommodation_discount: String(report.accommodation.discountValue || 0),  // String format
        accommodation_discount_type: report.accommodation.discountType === 'percentage' ? 'percentage' : 'flat',
        accommodation_discount_remarks: report.accommodation.discountRemarks || "",
        transportation_discount: String(report.transportation.discountValue || 0),  // String format
        transportation_discount_type: report.transportation.discountType === 'percentage' ? 'percentage' : 'flat',
        transportation_discount_remarks: report.transportation.discountRemarks || "",
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
    { id: 'group-details', name: 'Group Details' },
    { ...report.permits },
    { ...report.services },
    { ...report.accommodation },
    { ...report.transportation },
    ...report.customSections,
    { id: 'final', name: 'Final Summary' }
  ];

  const renderStepContent = () => {
    if (isLoading) return <LoadingStep />;

    // If no trek is selected yet, show the trek selection step
    if (currentStep === 0 && !report.trekId) {
      return <SelectTrekStep treks={trips || []} selectedTrekId={report.trekId} onSelectTrek={handleTrekSelect} />;
    }

    const stepIndex = currentStep;
    if (stepIndex < 0) return <LoadingStep />;

    // If a trek is selected, we need to adjust the step index by -1 since the first step is now trek selection
    const adjustedStepIndex = report.trekId ? stepIndex - 1 : stepIndex;
    const activeStepData = allCostingStepsMetadata[adjustedStepIndex];
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

    if (activeStepData.id === 'permits' || activeStepData.id === 'services' || activeStepData.id === 'accommodation' || activeStepData.id === 'transportation' || activeStepData.id === 'extraDetails' || report.customSections.some(cs => cs.id === activeStepData.id)) {
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
          onRemoveSection={removeSection}
          hideAddRow={activeStepData.id === 'permits' || activeStepData.id === 'services' || activeStepData.id === 'accommodation' || activeStepData.id === 'transportation' || activeStepData.id === 'extraDetails'}
          onAddPermit={activeStepData.id === 'permits' ? (item) => handleAddPermit(item) : undefined}
          onAddService={activeStepData.id === 'services' ? (item) => handleAddService(item) : undefined}
          onAddAccommodation={activeStepData.id === 'accommodation' ? (item) => handleAddAccommodation(item) : undefined}
          onAddTransportation={activeStepData.id === 'transportation' ? (item) => handleAddTransportation(item) : undefined}
          onAddExtraService={activeStepData.id === 'extraDetails' ? (item) => handleAddExtraService(item) : undefined}
          allPermits={activeStepData.id === 'permits' ? allPermits || [] : undefined}
          allServices={activeStepData.id === 'services' ? allServices || [] : undefined}
          allAccommodations={activeStepData.id === 'accommodation' ? allAccommodations || [] : undefined}
          allTransportations={activeStepData.id === 'transportation' ? allTransportations || [] : undefined}
          allExtraServices={activeStepData.id === 'extraDetails' ? allExtraServices || [] : undefined}
          isLoadingAllPermits={activeStepData.id === 'permits' ? isLoadingAllPermits : false}
          isLoadingAllServices={activeStepData.id === 'services' ? isLoadingAllServices : false}
          isLoadingAllAccommodations={activeStepData.id === 'accommodation' ? isLoadingAllAccommodations : false}
          isLoadingAllTransportations={activeStepData.id === 'transportation' ? isLoadingAllTransportations : false}
          isLoadingAllExtraServices={activeStepData.id === 'extraDetails' ? isLoadingAllExtraServices : false}
        />
      );
    }

    return <LoadingStep />;
  };

  const breadcrumbItems = (
    // If no trek is selected yet, show only the trek selection step
    !report.trekId ? [
      { label: 'Select Trek', isCurrent: currentStep === 0, stepIndex: 0 }
    ] : [
      // Otherwise show the trek name as the first "step" and then all other steps
      { label: report.trekName, isCurrent: false, stepIndex: -1 }, // Trek name is not clickable
      ...allCostingStepsMetadata.map((s, i) => ({
        label: s.name,
        isCurrent: currentStep === i + 1, // Add 1 to account for trek selection step
        stepIndex: i + 1, // Add 1 to account for trek selection step
      }))
    ]
  );

  const finalStepIndex = report.trekId ? allCostingStepsMetadata.length : 0; // When trek is selected, the final step index is the length of steps (since steps start from index 1 after trek selection)

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
                {report.trekId ? `For Trek: ${report.trekName}` : 'Select a trek to begin'}
              </p>
            </div>
          </div>
        </header>
      )}

      {renderStepContent()}

      {currentStep >= 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button 
            onClick={() => {
              // If we're on the Group Details step (1) and we have a trek selected, go back to trek selection (0)
              // Otherwise, go back normally
              if (currentStep === 1 && report.trekId) {
                setCurrentStep(0); // Go back to trek selection
              } else if (currentStep > 0) {
                setCurrentStep(prev => prev - 1);
              }
            }} 
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
                <a href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate" title={savedReportUrl}>
                  Traveler Form Link
                </a>
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              {currentStep === finalStepIndex ? (
                <Button onClick={handleFinish} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Finish
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    // If we're on the trek selection step and no trek is selected, don't proceed
                    if (currentStep === 0 && !report.trekId) {
                      // Trek selection automatically moves to next step when a trek is selected
                      // So this button should not do anything in this case
                      return;
                    }
                    setCurrentStep(prev => prev + 1);
                  }} 
                  disabled={currentStep === 0 && !report.trekId} 
                  className="flex-1"
                >
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