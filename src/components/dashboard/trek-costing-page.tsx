
"use client";

import React, { useState, useEffect, memo, useCallback, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, Copy, Edit, Save, ArrowLeft, ArrowRight, FileDown } from "lucide-react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb"

import type { Trek, CostRow, SectionState } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { handleExportPDF, handleExportExcel } from '@/lib/export';
import type { User } from '@/lib/auth';
import { postGroupsAndPackage, updateGroupsAndPackage, updateExtraInvoice, postExtraInvoice } from '@/lib/api-service';
import { useAccommodation } from '@/hooks/use-accommodation';
import { useTransportation } from '@/hooks/use-transportation';
import { useAllAccommodations } from '@/hooks/use-all-accommodations';
import { useAllTransportations } from '@/hooks/use-all-transportations';

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
  extraServices: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  reportUrl?: string;
  clientCommunicationMethod?: string;
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
  permits: createInitialSectionState('permits', 'Permits & Documents'),
  services: createInitialSectionState('services', 'Services'),
  accommodation: createInitialSectionState('accommodation', 'Accommodation'),
  transportation: createInitialSectionState('transportation', 'Transportation'),
  extraDetails: createInitialSectionState('extraDetails', 'Extra Details'),
  extraServices: createInitialSectionState('extraServices', 'Extra Services'), // New section for extra services
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
  onAddPermit?: (permit: any) => void; // Callback to add a permit
  onAddService?: (service: any) => void; // Callback to add a service
  onAddExtraService?: (extraService: any) => void; // Callback to add an extra service
  onAddAccommodation?: (accommodation: any) => void; // Callback to add an accommodation
  onAddTransportation?: (transportation: any) => void; // Callback to add a transportation
  allPermits?: any[]; // All available permits
  allServices?: any[]; // All available services
  allExtraServices?: any[]; // All available extra services
  allAccommodations?: any[]; // All available accommodations
  allTransportations?: any[]; // All available transportations
  isLoadingAllPermits?: boolean; // Loading state for all permits
  isLoadingAllServices?: boolean; // Loading state for all services
  isLoadingAllExtraServices?: boolean; // Loading state for all extra services
  isLoadingAllAccommodations?: boolean; // Loading state for all accommodations
  isLoadingAllTransportations?: boolean; // Loading state for all transportations
}

function TrekCostingPageComponent({ initialData, treks = [], user = null, onTrekSelect, skipGroupDetails = false, groupId, isReadOnly = false, onAddPermit, onAddService, onAddExtraService, onAddAccommodation, onAddTransportation, allPermits, allServices, allExtraServices, allAccommodations, allTransportations, isLoadingAllPermits, isLoadingAllServices, isLoadingAllExtraServices, isLoadingAllAccommodations, isLoadingAllTransportations }: TrekCostingPageProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [report, setReport] = useState<ReportState>(() => createInitialReportState(initialData?.groupId));
  const [accommodationTrekId, setAccommodationTrekId] = useState<string>('');

  // Fetch accommodation data for the selected trek
  const { data: accommodationData, isLoading: isLoadingAccommodation } = useAccommodation(accommodationTrekId);

  // Fetch transportation data for the selected trek
  const { data: transportationData, isLoading: isLoadingTransportation } = useTransportation(accommodationTrekId);

  // Fetch all accommodations for the accommodation section
  const { data: allAccommodationsData, isLoading: isLoadingAllAccommodationsData } = useAllAccommodations(accommodationTrekId);

  // Fetch all transportations for the transportation section
  const { data: allTransportationsData, isLoading: isLoadingAllTransportationsData } = useAllTransportations(accommodationTrekId);

  // Use hook data or fallback to props
  const finalAllAccommodations = allAccommodationsData || allAccommodations;
  const finalIsLoadingAllAccommodations = isLoadingAllAccommodationsData || isLoadingAllAccommodations;
  const finalAllTransportations = allTransportationsData || [];
  const finalIsLoadingAllTransportations = isLoadingAllTransportationsData || false;

  // Update accommodation trek ID when report's trek ID changes
  useEffect(() => {
    if (report.trekId) {
      setAccommodationTrekId(report.trekId);
    }
  }, [report.trekId]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(initialData?.reportUrl || null);
  const [isCopied, setIsCopied] = useState(false);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [includeServiceChargeInPdf, setIncludeServiceChargeInPdf] = useState(true);



  const calculatePermitTotal = (permit: any, no: number, times: number) => {
    if (permit.one_time) {
      return permit.rate;
    } else if (permit.per_person && permit.per_day) {
      return permit.rate * no * times;
    } else if (permit.per_person) {
      return permit.rate * no;
    } else if (permit.per_day) {
      return permit.rate * times;
    } else {
      return permit.rate * no * times;
    }
  };

  const calculateServiceTotal = (service: any, no: number, times: number) => {
    if (service.one_time) {
      return service.rate;
    } else if (service.per_person && service.per_day) {
      return service.rate * no * times;
    } else if (service.per_person) {
      return service.rate * no;
    } else if (service.per_day) {
      return service.rate * times;
    } else {
      return service.rate * no * times;
    }
  };

  const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
    if (extraService.one_time) {
      return extraService.rate;
    } else if (extraService.per_person && extraService.per_day) {
      return extraService.rate * no * times;
    } else if (extraService.per_person) {
      return extraService.rate * no;
    } else if (extraService.per_day) {
      return extraService.rate * times;
    } else {
      return extraService.rate * no * times;
    }
  };

  const calculateAccommodationTotal = (accommodation: any, no: number, times: number) => {
    if (accommodation.one_time) {
      return accommodation.rate;
    } else if (accommodation.per_person && accommodation.per_day) {
      return accommodation.rate * no * times;
    } else if (accommodation.per_person) {
      return accommodation.rate * no;
    } else if (accommodation.per_day) {
      return accommodation.rate * times;
    } else {
      return accommodation.rate * no * times;
    }
  };

  const calculateTransportationTotal = (transportation: any, no: number, times: number) => {
    if (transportation.one_time) {
      return transportation.rate;
    } else if (transportation.per_person && transportation.per_day) {
      return transportation.rate * no * times;
    } else if (transportation.per_person) {
      return transportation.rate * no;
    } else if (transportation.per_day) {
      return transportation.rate * times;
    } else {
      return transportation.rate * no * times;
    }
  };

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
            services: initialData.services || prev.services,
            accommodation: initialData.accommodation || prev.accommodation,
            transportation: initialData.transportation || prev.transportation,
            extraDetails: initialData.extraDetails || prev.extraDetails,
            extraServices: initialData.extraServices || prev.extraServices,
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
      }
    }
  }, [initialData, report.trekId]);

  // Update accommodation data when it changes and trekId matches
  useEffect(() => {
    if (accommodationData && report.trekId && accommodationData.length > 0) {
      setReport(prev => {
        if (prev.trekId !== report.trekId) return prev; // Only update for current trek

        // Filter default accommodations from API data
        const defaultAccommodations = accommodationData.filter(acc => acc.is_default).map(acc => ({
          id: crypto.randomUUID(),
          description: acc.name,
          rate: acc.rate,
          no: prev.groupSize,
          times: acc.times,
          total: calculateAccommodationTotal(acc, prev.groupSize, acc.times),
          per_person: acc.per_person,
          per_day: acc.per_day,
          one_time: acc.one_time,
          is_default: acc.is_default,
          is_editable: acc.is_editable,
          max_capacity: acc.max_capacity,
          from_place: acc.from_place,
          to_place: acc.to_place
        }));

        // Apply max_capacity splitting logic
        const splitAccommodations = defaultAccommodations.flatMap(row => splitRowByMaxCapacity(row, prev.groupSize));

        return {
          ...prev,
          accommodation: {
            ...prev.accommodation,
            rows: splitAccommodations
          }
        };
      });
    }
  }, [accommodationData, report.trekId, report.groupSize]);

  // Update transportation data when it changes and trekId matches
  useEffect(() => {
    if (transportationData && report.trekId && transportationData.length > 0) {
      setReport(prev => {
        if (prev.trekId !== report.trekId) return prev; // Only update for current trek

        // Filter default transportation from API data
        const defaultTransportations = transportationData.filter(trans => trans.is_default).map(trans => ({
          id: crypto.randomUUID(),
          description: trans.name,
          rate: trans.rate,
          no: prev.groupSize,
          times: trans.times,
          total: calculateTransportationTotal(trans, prev.groupSize, trans.times),
          per_person: trans.per_person,
          per_day: trans.per_day,
          one_time: trans.one_time,
          is_default: trans.is_default,
          is_editable: trans.is_editable,
          max_capacity: trans.max_capacity,
          from_place: trans.from_place,
          to_place: trans.to_place
        }));

        // Apply max_capacity splitting logic
        const splitTransportations = defaultTransportations.flatMap(row => splitRowByMaxCapacity(row, prev.groupSize));

        return {
          ...prev,
          transportation: {
            ...prev.transportation,
            rows: splitTransportations
          }
        };
      });
    }
  }, [transportationData, report.trekId, report.groupSize]);

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
    const sections = [report.permits, report.services, report.accommodation, report.transportation, report.extraDetails, report.extraServices, ...report.customSections];
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

  // Function to consolidate rows that were split due to max_capacity
  const consolidateSplitRows = (rows: CostRow[]): CostRow[] => {
    // Group rows by their original ID (before splitting)
    const groupedRows: Record<string, CostRow[]> = {};

    for (const row of rows) {
      // Extract the original ID from split row IDs (e.g., originalId-split-1 -> originalId)
      const originalId = row.id.replace(/-split-\d+$/, '');
      if (!groupedRows[originalId]) {
        groupedRows[originalId] = [];
      }
      groupedRows[originalId].push(row);
    }

    const consolidatedRows: CostRow[] = [];

    for (const [originalId, group] of Object.entries(groupedRows)) {
      if (group.length === 1) {
        // Not a split row, add as is
        consolidatedRows.push(group[0]);
      } else {
        // This is a split row, consolidate it
        const originalRow = { ...group[0] };
        // Remove the split suffix from ID
        originalRow.id = originalId;
        // Remove 'Additional ' prefix and split-specific description suffixes if present
        originalRow.description = originalRow.description.replace(/^Additional /, '').replace(/ \(max capacity\)| \(additional capacity\)$/g, '');

        // Sum up the quantities
        const totalNo = group.reduce((sum, row) => sum + (row.no || 0), 0);
        originalRow.no = totalNo;

        consolidatedRows.push(originalRow);
      }
    }

    return consolidatedRows;
  };

  // Function to split rows based on max_capacity and group size
  const splitRowByMaxCapacity = (row: CostRow, groupSize: number) => {
    const rows: CostRow[] = [];

    // If max_capacity is not defined or group size is less than or equal to max_capacity, return original row
    if (!row.max_capacity || groupSize <= row.max_capacity) {
      return [{ ...row, no: groupSize }];
    }

    // Calculate total number of rows needed using Math.ceil
    const totalRows = Math.ceil(groupSize / row.max_capacity);

    for (let i = 0; i < totalRows; i++) {
      // Calculate quantity for this row (max_capacity for all but potentially last row)
      const quantity = i === totalRows - 1 ?
        // For the last row, use remaining capacity if there's a remainder
        (groupSize % row.max_capacity === 0 ? row.max_capacity : groupSize % row.max_capacity) :
        // For other rows, use max_capacity
        row.max_capacity;

      rows.push({
        ...row,
        id: `${row.id}-split-${i + 1}`,
        no: quantity,
        description: `${row.description} ${i + 1}`
      });
    }

    return rows;
  };

  const handleGroupSizeChange = useCallback((size: number) => {
    setReport(currentReport => {
      const newReport = { ...currentReport, groupSize: size };

      const updateSectionForPax = (section: SectionState) => {
        // First, consolidate any existing split rows to get back to original state
        const consolidatedRows = consolidateSplitRows(section.rows);

        return {
          ...section,
          rows: consolidatedRows.flatMap(row => {
            let newTotal;
            if (section.id === 'permits' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
              newTotal = calculatePermitTotal(row, size, row.times || 0);
            } else if (section.id === 'services' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
              newTotal = calculateServiceTotal(row, size, row.times || 0);
            } else if (section.id === 'accommodation' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
              newTotal = calculateAccommodationTotal(row, size, row.times || 0);
            } else if (section.id === 'transportation' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
              newTotal = calculateServiceTotal(row, size, row.times || 0);
            } else if (section.id === 'extraDetails' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
              newTotal = calculateExtraServiceTotal(row, size, row.times || 0);
            } else {
              newTotal = (row.rate || 0) * size * (row.times || 0);
            }

            // Apply max_capacity logic
            const updatedRow: CostRow = {
              ...row,
              no: size,
              total: newTotal
            };

            return splitRowByMaxCapacity(updatedRow, size);
          })
        };
      };

      newReport.permits = updateSectionForPax(newReport.permits);
      newReport.services = updateSectionForPax(newReport.services);
      newReport.accommodation = updateSectionForPax(newReport.accommodation);
      newReport.transportation = updateSectionForPax(newReport.transportation);
      newReport.extraDetails = updateSectionForPax(newReport.extraDetails);
      newReport.extraServices = updateSectionForPax(newReport.extraServices);
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
      if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'accommodation' || sectionId === 'transportation' || sectionId === 'extraDetails' || sectionId === 'extraServices') {
        const sectionKey = sectionId as 'permits' | 'services' | 'accommodation' | 'transportation' | 'extraDetails' | 'extraServices';
        newReport[sectionKey] = updater(newReport[sectionKey]);
      } else {
        newReport.customSections = newReport.customSections.map(s =>
          s.id === sectionId ? updater(s) : s
        );
      }
      return newReport;
    });
  }, []);

  const handleRowChange = useCallback((id: string, field: keyof CostRow, value: any, sectionId: string) => {
    handleSectionUpdate(sectionId, (section) => {
      // Find the row to update
      const rowToUpdate = section.rows.find(row => row.id === id);

      if (!rowToUpdate) {
        return section; // If row not found, return section unchanged
      }

      // Create updated row
      const updatedRow = { ...rowToUpdate, [field]: value };

      // If quantity (no) field is being changed, check max_capacity constraint
      if (field === 'no' && updatedRow.max_capacity && updatedRow.no > updatedRow.max_capacity) {
        // Remove the original row and create new rows based on max_capacity
        const newRows = section.rows.filter(row => row.id !== id);

        // Calculate total number of rows needed using Math.ceil
        const totalRows = Math.ceil(updatedRow.no / updatedRow.max_capacity);

        // Create split rows based on max_capacity
        const splitRows = [];
        for (let i = 0; i < totalRows; i++) {
          const row = {
            ...updatedRow,
            id: `${updatedRow.id}-split-${i + 1}`,
            no: quantity,
            description: `${updatedRow.description} ${i + 1}`
          };

          // Calculate total for the row
          if (sectionId === 'permits' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
            row.total = calculatePermitTotal(row, row.no, row.times);
          } else if (sectionId === 'services' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
            row.total = calculateServiceTotal(row, row.no, row.times);
          } else if (sectionId === 'accommodation' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
            row.total = calculateAccommodationTotal(row, row.no, row.times);
          } else if (sectionId === 'extraDetails' && row.per_person !== undefined && row.per_day !== undefined && row.one_time !== undefined) {
            row.total = calculateExtraServiceTotal(row, row.no, row.times);
          } else {
            row.total = (row.rate || 0) * row.no * (row.times || 0);
          }

          splitRows.push(row);
        }

        return {
          ...section,
          rows: [...newRows, ...splitRows]
        };
      } else {
        // For regular updates, just update the row
        const updatedRows = section.rows.map(row => {
          if (row.id === id) {
            const newRow = { ...row, [field]: value };
            if (field === 'no' || field === 'rate' || field === 'times') {
              // Calculate total based on properties if it's a permit row
              if (sectionId === 'permits' && newRow.per_person !== undefined && newRow.per_day !== undefined && newRow.one_time !== undefined) {
                newRow.total = calculatePermitTotal(newRow, newRow.no || 0, newRow.times || 0);
              } else if (sectionId === 'services' && newRow.per_person !== undefined && newRow.per_day !== undefined && newRow.one_time !== undefined) {
                newRow.total = calculateServiceTotal(newRow, newRow.no || 0, newRow.times || 0);
              } else if (sectionId === 'accommodation' && newRow.per_person !== undefined && newRow.per_day !== undefined && newRow.one_time !== undefined) {
                newRow.total = calculateAccommodationTotal(newRow, newRow.no || 0, newRow.times || 0);
              } else if (sectionId === 'extraDetails' && newRow.per_person !== undefined && newRow.per_day !== undefined && newRow.one_time !== undefined) {
                newRow.total = calculateExtraServiceTotal(newRow, newRow.no || 0, newRow.times || 0);
              } else {
                newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
              }
            }
            return newRow;
          }
          return row;
        });

        return {
          ...section,
          rows: updatedRows
        };
      }
    });
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

    // Update accommodation trek ID immediately to trigger accommodation data loading
    setAccommodationTrekId(trekId);

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

      // Apply splitting logic
      const splitPermits = initialPermits.flatMap(p => splitRowByMaxCapacity(p, prev.groupSize));
      const splitExtraDetails = initialExtraDetails.flatMap(e => splitRowByMaxCapacity(e, prev.groupSize));


      // Initialize accommodation data - start with empty rows, accommodation data will be loaded separately
      const initialAccommodation: CostRow[] = [];

      const trekShortName = getTrekShortName(newSelectedTrek.name);
      const timestamp = getCurrentTimestamp();
      const defaultGroupName = `${trekShortName}-${timestamp}`;

      return {
        ...prev,
        trekId: newSelectedTrek.id,
        trekName: newSelectedTrek.name,
        groupName: defaultGroupName,
        permits: { ...prev.permits, rows: splitPermits },
        extraDetails: { ...prev.extraDetails, rows: splitExtraDetails },
        accommodation: { ...prev.accommodation, rows: initialAccommodation as CostRow[] },
      };
    });
    // Trek selection is complete, do not change the current step
    // The current step should remain as it is to maintain user's workflow position
  }, [treks, onTrekSelect]);

  const addRow = useCallback((sectionId: string) => {
    const newRow: CostRow = {
      id: crypto.randomUUID(),
      description: "",
      rate: 0,
      no: report.groupSize,
      times: 1,
      total: 0,
      is_editable: true, // Allow editing of all fields for custom rows
      per_person: false, // Default to not per person
      per_day: false,    // Default to not per day
      one_time: false    // Default to not one time
    };
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

    const permitsData = report.permits.rows.map(row => ({
      name: row.description,
      rate: row.rate?.toString() || '0',
      times: parseInt(row.times?.toString() || '1'),
      numbers: parseInt(row.no?.toString() || '1'),
      per_person: row.per_person || false,
      per_day: row.per_day || false,
      one_time: row.one_time || false,
      is_default: row.is_default || false,
      is_editable: row.is_editable !== undefined ? row.is_editable : true,
      max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
      from_place: row.from_place || '',
      to_place: row.to_place || ''
    }));


    const servicesData = report.services.rows.map(row => ({
      name: row.description,
      rate: row.rate?.toString() || '0',
      times: parseInt(row.times?.toString() || '1'),
      numbers: parseInt(row.no?.toString() || '1'),
      per_person: row.per_person || false,
      per_day: row.per_day || false,
      one_time: row.one_time || false,
      is_default: row.is_default || false,
      is_editable: row.is_editable !== undefined ? row.is_editable : true,
      max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
      from_place: row.from_place || '',
      to_place: row.to_place || ''
    }));

    const extraServicesMap = new Map();

    report.extraDetails.rows.forEach(row => {
      let service_name, param_name;
      if (row.description.includes(' - ')) {
        const parts = row.description.split(' - ');
        service_name = parts[0];
        param_name = parts.slice(1).join(' - ');
      } else {
        service_name = row.description;
        param_name = row.description;
      }

      if (!extraServicesMap.has(service_name)) {
        extraServicesMap.set(service_name, {
          service_name: service_name,
          params: []
        });
      }
      extraServicesMap.get(service_name).params.push({
        name: param_name,
        rate: row.rate?.toString() || '0', // Keep rate as string as required by API
        times: parseInt(row.times?.toString() || '1'), // Convert times to integer
        numbers: parseInt(row.no?.toString() || '1'), // Convert numbers to integer
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        is_default: row.is_default || false,
        is_editable: row.is_editable !== undefined ? row.is_editable : true,
        max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
        from_place: row.from_place || '',
        to_place: row.to_place || ''
      });
    });

    // Process report.extraServices
    report.extraServices.rows.forEach(row => {
      // For extraServices, treat each row as a separate service
      const service_name = row.description || 'Extra Service';

      if (!extraServicesMap.has(service_name)) {
        extraServicesMap.set(service_name, {
          service_name: service_name,
          params: []
        });
      }
      extraServicesMap.get(service_name).params.push({
        name: row.description,
        rate: row.rate?.toString() || '0', // Keep rate as string as required by API
        times: parseInt(row.times?.toString() || '1'), // Convert times to integer
        numbers: parseInt(row.no?.toString() || '1'), // Convert numbers to integer
        per_person: row.per_person || false,
        per_day: row.per_day || false,
        one_time: row.one_time || false,
        is_default: row.is_default || false,
        is_editable: row.is_editable !== undefined ? row.is_editable : true,
        max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
        from_place: row.from_place || '',
        to_place: row.to_place || ''
      });
    });

    const extraServicesData = Array.from(extraServicesMap.values());

    // Transform accommodation data
    const accommodationData = report.accommodation.rows.map(row => ({
      name: row.description,
      rate: row.rate?.toString() || '0', // Keep rate as string as required by API
      times: parseInt(row.times?.toString() || '1'), // Convert times to integer
      numbers: parseInt(row.no?.toString() || '1'), // Convert numbers to integer
      per_person: row.per_person || false,
      per_day: row.per_day || false,
      one_time: row.one_time || false,
      is_default: row.is_default || false,
      is_editable: row.is_editable !== undefined ? row.is_editable : true,
      max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
      from_place: row.from_place || '',
      to_place: row.to_place || ''
    }));

    // Transform transportation data
    const transportationData = report.transportation.rows.map(row => ({
      name: row.description,
      rate: row.rate?.toString() || '0', // Keep rate as string as required by API
      times: parseInt(row.times?.toString() || '1'), // Convert times to integer
      numbers: parseInt(row.no?.toString() || '1'), // Convert numbers to integer
      per_person: row.per_person || false,
      per_day: row.per_day || false,
      one_time: row.one_time || false,
      is_default: row.is_default || false,
      is_editable: row.is_editable !== undefined ? row.is_editable : true,
      max_capacity: row.max_capacity !== null && row.max_capacity !== undefined ? parseInt(row.max_capacity?.toString() || '0') : null, // Convert max_capacity to integer if not null
      from_place: row.from_place || '',
      to_place: row.to_place || ''
    }));

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
      accommodation: accommodationData,
      transportation: transportationData,
      extra_services: extraServicesData,
      service_discount: String(report.services.discountValue || 0),
      service_discount_type: report.services.discountType === 'percentage' ? 'percentage' : 'flat',
      service_discount_remarks: report.services.discountRemarks || "",
      accommodation_discount: String(report.accommodation.discountValue || 0),
      accommodation_discount_type: report.accommodation.discountType === 'percentage' ? 'percentage' : 'flat',
      accommodation_discount_remarks: report.accommodation.discountRemarks || "",
      transportation_discount: String(report.transportation.discountValue || 0),
      transportation_discount_type: report.transportation.discountType === 'percentage' ? 'percentage' : 'flat',
      transportation_discount_remarks: report.transportation.discountRemarks || "",
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
      { id: 'accommodation', name: 'Accommodation' },
      { id: 'transportation', name: 'Transportation' },
      ...report.customSections,
      { id: 'final', name: 'Final Summary' }
    );

    return steps;
  }, [report.permits, report.services, report.accommodation, report.transportation, report.extraServices, report.customSections, skipGroupDetails]);

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
          isRateReadOnly={false}
          hideAddRow={false}
          // Additional props for extra services section
          onAddExtraService={onAddExtraService}
          allExtraServices={allExtraServices}
          isLoadingAllExtraServices={isLoadingAllExtraServices}
        />
      );
    }

    if (activeStepData.id === 'permits') {
      return (
        <CostTable
          section={report[activeStepData.id as keyof ReportState] as SectionState}
          isCustom={false}
          isDescriptionEditable={!isReadOnly}
          isReadOnly={isReadOnly}
          onRowChange={handleRowChange}
          onDiscountTypeChange={handleDiscountTypeChange}
          onDiscountValueChange={handleDiscountValueChange}
          onDiscountRemarksChange={handleDiscountRemarksChange}
          onAddRow={undefined}
          onRemoveRow={isReadOnly ? undefined : removeRow}
          onEditSection={isReadOnly ? undefined : handleOpenEditSectionModal}
          onRemoveSection={isReadOnly ? undefined : removeSection}
          isRateReadOnly={false}
          hideAddRow={true}
          // Additional props for permits section
          onAddPermit={onAddPermit}
          allPermits={allPermits}
          isLoadingAllPermits={isLoadingAllPermits}
        />
      );
    } else if (activeStepData.id === 'services' || activeStepData.id === 'accommodation' || activeStepData.id === 'transportation' || report.customSections.some(cs => cs.id === activeStepData.id)) {
      return (
        <CostTable
          section={report[activeStepData.id as keyof ReportState] as SectionState || report.customSections.find(cs => cs.id === activeStepData.id)!}
          isCustom={report.customSections.some(cs => cs.id === activeStepData.id)}
          isDescriptionEditable={activeStepData.id !== 'permits' && !isReadOnly}
          isDescriptionInlineEditable={activeStepData.id === 'extraDetails'}
          isReadOnly={isReadOnly}
          onRowChange={handleRowChange}
          onDiscountTypeChange={handleDiscountTypeChange}
          onDiscountValueChange={handleDiscountValueChange}
          onDiscountRemarksChange={handleDiscountRemarksChange}
          onAddRow={activeStepData.id === 'extraDetails' && !isReadOnly ? addRow : undefined}
          onRemoveRow={isReadOnly ? undefined : removeRow}
          onEditSection={isReadOnly ? undefined : handleOpenEditSectionModal}
          onRemoveSection={isReadOnly ? undefined : removeSection}
          isRateReadOnly={activeStepData.id === 'services' || activeStepData.id === 'accommodation' || activeStepData.id === 'transportation'}
          hideAddRow={activeStepData.id === 'accommodation'}
          // Additional props for services, accommodation, transportation, and extra services sections
          onAddService={activeStepData.id === 'services' ? onAddService : undefined}
          onAddExtraService={activeStepData.id === 'extraDetails' ? onAddExtraService : undefined}
          onAddAccommodation={activeStepData.id === 'accommodation' ? onAddAccommodation : undefined}
          onAddTransportation={activeStepData.id === 'transportation' ? onAddTransportation : undefined}
          allServices={activeStepData.id === 'services' ? allServices : undefined}
          allExtraServices={activeStepData.id === 'extraDetails' ? allExtraServices : undefined}
          allAccommodations={activeStepData.id === 'accommodation' ? allAccommodations : undefined}
          allTransportations={activeStepData.id === 'transportation' ? allTransportations : undefined}
          isLoadingAllServices={activeStepData.id === 'services' ? isLoadingAllServices : undefined}
          isLoadingAllExtraServices={activeStepData.id === 'extraDetails' ? isLoadingAllExtraServices : undefined}
          isLoadingAllAccommodations={activeStepData.id === 'accommodation' ? isLoadingAllAccommodations : undefined}
          isLoadingAllTransportations={activeStepData.id === 'transportation' ? isLoadingAllTransportations : undefined}
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


