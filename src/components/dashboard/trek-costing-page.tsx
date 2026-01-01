
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
  discountRemarks: '',
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



  const calculateRowTotal = (item: any, no: number, times: number) => {
    const rate = item.rate || 0;
    
    // Apply calculation based on boolean flags
    if (item.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return rate;
    } else if (item.per_person && item.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return rate * no * times;
    } else if (item.per_person) {
      // If per_person is true, calculate as rate * no
      return rate * no;
    } else if (item.per_day) {
      // If per_day is true, calculate as rate * times
      return rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return rate * no * times;
    }
  };

  const calculateRowQuantity = (item: any, groupSize: number) => {
    if (item.max_capacity && item.max_capacity > 0) {
      // Jeep max capacity 7 means it can hold a max of 7 people, if people +7, jeep number should be 2
      // This applies to any item with max_capacity
      return Math.ceil(groupSize / item.max_capacity);
    }

    if (item.per_person) {
      return groupSize;
    }

    return 1;
  };

  const calculateRowTimes = (item: any, trekTimes: number) => {
    if (item.per_day) {
      return trekTimes;
    }
    if (item.one_time) {
      return 1;
    }
    return 1;
  };

  const calculatePermitTotal = (permit: any, no: number, times: number) => {
    return calculateRowTotal(permit, no, times);
  };

  const calculateServiceTotal = (service: any, no: number, times: number) => {
    return calculateRowTotal(service, no, times);
  };

  const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
    return calculateRowTotal(extraService, no, times);
  };

  const calculateAccommodationTotal = (accommodation: any, no: number, times: number) => {
    return calculateRowTotal(accommodation, no, times);
  };

  const calculateTransportationTotal = (transportation: any, no: number, times: number) => {
    return calculateRowTotal(transportation, no, times);
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
        // Extract groupSize from total_space if it exists in initialData
        const extractedGroupSize = initialData.total_space || initialData.groupSize || 1;
        
        const fullReport = {
          ...createInitialReportState(initialData.groupId),
          ...initialData,
          groupSize: extractedGroupSize,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        };

        // If groupName is empty or missing, generate it from the trek name
        if (!fullReport.groupName && initialData.trekId) {
          const trek = treks?.find(t => t.id === initialData.trekId);
          if (trek) {
            const shortName = getTrekShortName(trek.name);
            const timestamp = getCurrentTimestamp();
            fullReport.groupName = `${shortName}-${timestamp}`;
            if (!fullReport.trekName) {
              fullReport.trekName = trek.name;
            }
          }
        }

        const selectedTrek = treks?.find(t => t.id === initialData.trekId);
        // Use package.times if available in initialData, otherwise use selectedTrek.times
        const trekTimes = initialData.package?.times || selectedTrek?.times || 1;

        const updateRowsWithTripTimes = (rows: CostRow[]) => {
          return rows.map(row => {
            const newNo = calculateRowQuantity(row, fullReport.groupSize || 1);
            // For initial data loading, preserve the times value from the API response
            // The API already calculates the correct times based on per_day and one_time flags
            // Only recalculate if we're creating new items (no existing times value)
            const newTimes = ('times' in row && row.times !== undefined && row.times !== null) ? row.times : (row.per_day ? trekTimes : (row.one_time ? 1 : 1));
            // Preserve all original properties and update calculated ones
            return { 
              ...row,
              no: newNo, 
              times: newTimes, 
              total: calculateRowTotal({ ...row, times: newTimes }, newNo, newTimes),
              // Ensure description is properly mapped from name if missing
              description: row.description || (row as any).name || '',
            };
          });
        };

        if (prev.trekId === initialData.trekId) {
          const updatedReport = {
            ...prev,
            permits: initialData.permits ? { ...initialData.permits, rows: updateRowsWithTripTimes(initialData.permits.rows || []) } : prev.permits,
            services: initialData.services ? { ...initialData.services, rows: updateRowsWithTripTimes(initialData.services.rows || []) } : prev.services,
            accommodation: initialData.accommodation ? { ...initialData.accommodation, rows: updateRowsWithTripTimes(initialData.accommodation.rows || []) } : prev.accommodation,
            transportation: initialData.transportation ? { ...initialData.transportation, rows: updateRowsWithTripTimes(initialData.transportation.rows || []) } : prev.transportation,
            extraDetails: initialData.extraDetails ? { ...initialData.extraDetails, rows: updateRowsWithTripTimes(initialData.extraDetails.rows || []) } : prev.extraDetails,
            extraServices: initialData.extraServices ? { ...initialData.extraServices, rows: updateRowsWithTripTimes(initialData.extraServices.rows || []) } : prev.extraServices,
          };

          console.log('TrekCostingPage: Merging data for same trek', {
            permitsCount: updatedReport.permits?.rows?.length || 0,
            servicesCount: updatedReport.services?.rows?.length || 0
          });

          return updatedReport;
        }

        const finalReport = {
          ...fullReport,
          permits: fullReport.permits ? { ...fullReport.permits, rows: updateRowsWithTripTimes(fullReport.permits.rows || []) } : fullReport.permits,
          services: fullReport.services ? { ...fullReport.services, rows: updateRowsWithTripTimes(fullReport.services.rows || []) } : fullReport.services,
          accommodation: fullReport.accommodation ? { ...fullReport.accommodation, rows: updateRowsWithTripTimes(fullReport.accommodation.rows || []) } : fullReport.accommodation,
          transportation: fullReport.transportation ? { ...fullReport.transportation, rows: updateRowsWithTripTimes(fullReport.transportation.rows || []) } : fullReport.transportation,
          extraDetails: fullReport.extraDetails ? { ...fullReport.extraDetails, rows: updateRowsWithTripTimes(fullReport.extraDetails.rows || []) } : fullReport.extraDetails,
          extraServices: fullReport.extraServices ? { ...fullReport.extraServices, rows: updateRowsWithTripTimes(fullReport.extraServices.rows || []) } : fullReport.extraServices,
        };

        console.log('TrekCostingPage: Using full report for new trek');
        return finalReport;
      });

      if (initialData.isNew && !initialData.trekId) {
        setCurrentStep(0);
      }
    }
  }, [initialData, report.trekId, treks]);

  // Update accom modation data when it changes and trekId matches
  useEffect(() => {
    if (accommodationData && report.trekId && accommodationData.length > 0) {
      setReport(prev => {
        if (prev.trekId !== report.trekId) return prev; // Only update for current trek

        const defaultAccommodations = accommodationData.filter(acc => acc.is_default).map(acc => {
          // For initial data loading, preserve the times value from the API response
          // The API already calculates the correct times based on per_day and one_time flags
          const accTimes = ('times' in acc && acc.times !== undefined && acc.times !== null) ? acc.times : (acc.per_day ? (selectedTrek?.times || 1) : (acc.one_time ? 1 : 1));
          const accNo = calculateRowQuantity(acc, prev.groupSize);
          const row = {
            id: crypto.randomUUID(),
            description: acc.name,
            rate: acc.rate,
            no: accNo,
            times: accTimes,
            total: calculateAccommodationTotal(acc, accNo, accTimes),
            per_person: acc.per_person,
            per_day: acc.per_day,
            one_time: acc.one_time,
            is_default: acc.is_default,
            is_compulsory: (acc as any).is_compulsory || false,
            is_editable: acc.is_editable,
            max_capacity: acc.max_capacity,
            from_place: acc.from_place,
            to_place: acc.to_place
          };
          return row;
        });

        return {
          ...prev,
          accommodation: {
            ...prev.accommodation,
            rows: defaultAccommodations
          }
        };
      });
    }
  }, [accommodationData, report.trekId, report.groupSize]);

  useEffect(() => {
    if (transportationData && report.trekId && transportationData.length > 0) {
      setReport(prev => {
        if (prev.trekId !== report.trekId) return prev; // Only update for current trek

        // Filter default transportation from API data
        const defaultTransportations = transportationData.filter(trans => trans.is_default).map(trans => {
          // For initial data loading, preserve the times value from the API response
          // The API already calculates the correct times based on per_day and one_time flags
          const transTimes = ('times' in trans && trans.times !== undefined && trans.times !== null) ? trans.times : (trans.per_day ? (selectedTrek?.times || 1) : (trans.one_time ? 1 : 1));
          const transNo = calculateRowQuantity(trans, prev.groupSize);
          const row = {
            id: crypto.randomUUID(),
            description: trans.name,
            rate: trans.rate,
            no: transNo,
            times: transTimes,
            total: calculateTransportationTotal(trans, transNo, transTimes),
            per_person: trans.per_person,
            per_day: trans.per_day,
            one_time: trans.one_time,
            is_default: trans.is_default,
            is_compulsory: (trans as any).is_compulsory || false,
            is_editable: trans.is_editable,
            max_capacity: trans.max_capacity,
            from_place: trans.from_place,
            to_place: trans.to_place
          };
          return row;
        });

        return {
          ...prev,
          transportation: {
            ...prev.transportation,
            rows: defaultTransportations
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


  const handleGroupSizeChange = useCallback((size: number) => {
    setReport(currentReport => {
      const newReport = { ...currentReport, groupSize: size };

      const updateSectionForPax = (section: SectionState) => {
        return {
          ...section,
          rows: section.rows.map(row => {
            const newNo = calculateRowQuantity(row, size);
            // Calculate times based on per_day flag and trek times
            const newTimes = row.per_day ? (selectedTrek?.times || 1) : (row.one_time ? 1 : 1);
            return {
              ...row,
              no: newNo,
              times: newTimes,
              total: calculateRowTotal(row, newNo, newTimes),
              // Ensure description is properly mapped from name if missing
              description: row.description || (row as any).name || '',
            };
          })
        };
      };

      newReport.permits = updateSectionForPax(newReport.permits);
      newReport.services = updateSectionForPax(newReport.services);
      newReport.accommodation = updateSectionForPax(newReport.accommodation);
      newReport.transportation = updateSectionForPax(newReport.transportation);
      newReport.extraDetails = updateSectionForPax(newReport.extraDetails);
      newReport.extraServices = updateSectionForPax(newReport.extraServices || { id: 'extraServices', name: 'Extra Services', rows: [] });
      newReport.customSections = (newReport.customSections || []).map(updateSectionForPax);

      return newReport;
    });
  }, [calculateRowQuantity, calculateRowTotal, selectedTrek?.times]);

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
    handleSectionUpdate(sectionId, (section) => ({
      ...section,
      rows: section.rows.map((row) => {
        if (row.id === id) {
          // Update the field value
          const updatedRow = { ...row, [field]: value };
          
          // If the changed field affects times or quantity calculations, recalculate them
          let newNo = updatedRow.no;
          let newTimes = updatedRow.times;
          
          if (field === 'per_person' || field === 'per_day' || field === 'one_time' || field === 'max_capacity') {
            // Recalculate no based on the updated flags
            newNo = calculateRowQuantity(updatedRow, report.groupSize);
            // Recalculate times based on the updated flags
            newTimes = updatedRow.per_day ? (selectedTrek?.times || 1) : (updatedRow.one_time ? 1 : 1);
          }
          
          // Update the row with new values and recalculate total
          const newRow = {
            ...updatedRow,
            no: newNo,
            times: newTimes,
            total: calculateRowTotal(updatedRow, newNo, newTimes)
          };
          
          return newRow;
        }
        return row;
      })
    }));
  }, [handleSectionUpdate, report.groupSize, selectedTrek?.times]);

  const handleDiscountTypeChange = useCallback((sectionId: string, type: 'amount' | 'percentage') => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountType: type }));
  }, [handleSectionUpdate]);

  const handleDiscountValueChange = useCallback((sectionId: string, value: number) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountValue: value }));
  }, [handleSectionUpdate]);

  const handleDiscountRemarksChange = useCallback((sectionId: string, remarks: string) => {
    handleSectionUpdate(sectionId, (section) => ({ ...section, discountRemarks: remarks }));
  }, [handleSectionUpdate]);

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
      const initialPermits = newSelectedTrek.permits?.map(p => {
        const permitTimes = calculateRowTimes(p, newSelectedTrek.times || p.times || 1);
        const permitNo = calculateRowQuantity(p, prev.groupSize);
        return {
          id: crypto.randomUUID(),
          description: p.name,
          rate: p.rate,
          no: permitNo,
          times: permitTimes,
          total: calculatePermitTotal(p, permitNo, permitTimes),
          is_compulsory: p.is_compulsory || false,
          per_person: p.per_person,
          per_day: p.per_day,
          one_time: p.one_time,
          max_capacity: p.max_capacity,
          from_place: p.from_place,
          to_place: p.to_place
        };
      }) || [];

      const initialExtraDetails = [
        {
          id: crypto.randomUUID(),
          description: 'Satellite device',
          rate: 0,
          no: prev.groupSize,
          times: 1,
          total: 0,
          is_compulsory: false,
          per_person: false,
          per_day: false,
          one_time: true
        },
        {
          id: crypto.randomUUID(),
          description: 'Adv less',
          rate: 0,
          no: prev.groupSize,
          times: 1,
          total: 0,
          is_compulsory: false,
          per_person: false,
          per_day: false,
          one_time: true
        }
      ].map(e => ({
        ...e,
        times: calculateRowTimes(e, newSelectedTrek.times || 1),
        no: calculateRowQuantity(e, prev.groupSize)
      })).map(e => ({
        ...e,
        total: calculateRowTotal(e, e.no, e.times)
      }));

      const updateRowsForTrekChange = (rows: CostRow[]) => {
        return rows.map(row => {
          // Calculate the appropriate times value based on the item's flags and the new trek's duration
          const newTimes = row.per_day ? (newSelectedTrek.times || 1) : (row.one_time ? 1 : 1);
          // Calculate the appropriate quantity value based on the item's flags and current group size
          const newNo = calculateRowQuantity(row, prev.groupSize);
          
          return {
            ...row,
            no: newNo,
            times: newTimes,
            total: calculateRowTotal(row, newNo, newTimes),
            // Ensure description is properly mapped from name if missing
            description: row.description || (row as any).name || '',
          };
        });
      };

      const trekShortName = getTrekShortName(newSelectedTrek.name);
      const timestamp = getCurrentTimestamp();
      const defaultGroupName = `${trekShortName}-${timestamp}`;

      return {
        ...prev,
        trekId: newSelectedTrek.id,
        trekName: newSelectedTrek.name,
        groupName: defaultGroupName,
        permits: { ...prev.permits, rows: initialPermits },
        services: { ...prev.services, rows: updateRowsForTrekChange(prev.services.rows) },
        accommodation: { ...prev.accommodation, rows: updateRowsForTrekChange(prev.accommodation.rows) },
        transportation: { ...prev.transportation, rows: updateRowsForTrekChange(prev.transportation.rows) },
        extraDetails: { ...prev.extraDetails, rows: initialExtraDetails },
        extraServices: { ...prev.extraServices, rows: updateRowsForTrekChange(prev.extraServices.rows) },
        customSections: prev.customSections.map(s => ({ ...s, rows: updateRowsForTrekChange(s.rows) }))
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
      times: 1, // Default to 1, will be updated based on per_day/one_time flags
      total: 0, // Will be calculated after adding to section
      is_editable: true,
      per_person: false,
      per_day: false,
      one_time: false
    };
    handleSectionUpdate(sectionId, (prev) => ({ ...prev, rows: [...prev.rows, newRow] }));
  }, [handleSectionUpdate, report.groupSize, selectedTrek?.times]);

  const localOnAddPermit = useCallback((permit: any) => {
    // For new items, preserve the times value from API response if available, otherwise calculate
    const permitTimes = ('times' in permit && permit.times !== undefined && permit.times !== null) ? permit.times : (permit.per_day ? (selectedTrek?.times || 1) : (permit.one_time ? 1 : 1));
    const permitNo = calculateRowQuantity(permit, report.groupSize);
    const row: CostRow = {
      id: crypto.randomUUID(),
      description: permit.name,
      rate: permit.rate,
      no: permitNo,
      times: permitTimes,
      total: calculatePermitTotal(permit, permitNo, permitTimes),
      per_person: permit.per_person,
      per_day: permit.per_day,
      one_time: permit.one_time,
      is_default: permit.is_default,
      is_editable: permit.is_editable,
      max_capacity: permit.max_capacity,
      from_place: permit.from_place,
      to_place: permit.to_place
    };
    handleSectionUpdate('permits', (prev) => ({ ...prev, rows: [...prev.rows, row] }));
    if (onAddPermit) onAddPermit(permit);
  }, [handleSectionUpdate, report.groupSize, onAddPermit, selectedTrek?.times]);

  const localOnAddService = useCallback((service: any) => {
    // For new items, preserve the times value from API response if available, otherwise calculate
    const serviceTimes = ('times' in service && service.times !== undefined && service.times !== null) ? service.times : (service.per_day ? (selectedTrek?.times || 1) : (service.one_time ? 1 : 1));
    const serviceNo = calculateRowQuantity(service, report.groupSize);
    const row: CostRow = {
      id: crypto.randomUUID(),
      description: service.name,
      rate: service.rate,
      no: serviceNo,
      times: serviceTimes,
      total: calculateServiceTotal(service, serviceNo, serviceTimes),
      per_person: service.per_person,
      per_day: service.per_day,
      one_time: service.one_time,
      is_default: service.is_default,
      is_editable: service.is_editable,
      max_capacity: service.max_capacity,
      from_place: service.from_place,
      to_place: service.to_place
    };
    handleSectionUpdate('services', (prev) => ({ ...prev, rows: [...prev.rows, row] }));
    if (onAddService) onAddService(service);
  }, [handleSectionUpdate, report.groupSize, onAddService, selectedTrek?.times]);

  const localOnAddExtraService = useCallback((extraService: any) => {
    // For new items, preserve the times value from API response if available, otherwise calculate
    const extraServiceTimes = ('times' in extraService && extraService.times !== undefined && extraService.times !== null) ? extraService.times : (extraService.per_day ? (selectedTrek?.times || 1) : (extraService.one_time ? 1 : 1));
    const extraServiceNo = calculateRowQuantity(extraService, report.groupSize);
    const row: CostRow = {
      id: crypto.randomUUID(),
      description: extraService.description || `${extraService.serviceName} - ${extraService.name}`,
      rate: extraService.rate,
      no: extraServiceNo,
      times: extraServiceTimes,
      total: calculateExtraServiceTotal(extraService, extraServiceNo, extraServiceTimes),
      per_person: extraService.per_person,
      per_day: extraService.per_day,
      one_time: extraService.one_time,
      is_default: extraService.is_default,
      is_editable: extraService.is_editable,
      max_capacity: extraService.max_capacity,
      from_place: extraService.from_place,
      to_place: extraService.to_place
    };
    handleSectionUpdate('extraDetails', (prev) => ({ ...prev, rows: [...prev.rows, row] }));
    if (onAddExtraService) onAddExtraService(extraService);
  }, [handleSectionUpdate, report.groupSize, onAddExtraService, selectedTrek?.times]);

  const localOnAddAccommodation = useCallback((accommodation: any) => {
    // For new items, preserve the times value from API response if available, otherwise calculate
    const accommodationTimes = ('times' in accommodation && accommodation.times !== undefined && accommodation.times !== null) ? accommodation.times : (accommodation.per_day ? (selectedTrek?.times || 1) : (accommodation.one_time ? 1 : 1));
    const accommodationNo = calculateRowQuantity(accommodation, report.groupSize);
    const row: CostRow = {
      id: crypto.randomUUID(),
      description: accommodation.name,
      rate: accommodation.rate,
      no: accommodationNo,
      times: accommodationTimes,
      total: calculateAccommodationTotal(accommodation, accommodationNo, accommodationTimes),
      per_person: accommodation.per_person,
      per_day: accommodation.per_day,
      one_time: accommodation.one_time,
      is_default: accommodation.is_default,
      is_editable: accommodation.is_editable,
      max_capacity: accommodation.max_capacity,
      from_place: accommodation.from_place,
      to_place: accommodation.to_place
    };
    handleSectionUpdate('accommodation', (prev) => ({ ...prev, rows: [...prev.rows, row] }));
    if (onAddAccommodation) onAddAccommodation(accommodation);
  }, [handleSectionUpdate, report.groupSize, onAddAccommodation, selectedTrek?.times]);

  const localOnAddTransportation = useCallback((transportation: any) => {
    // For new items, preserve the times value from API response if available, otherwise calculate
    const transportationTimes = ('times' in transportation && transportation.times !== undefined && transportation.times !== null) ? transportation.times : (transportation.per_day ? (selectedTrek?.times || 1) : (transportation.one_time ? 1 : 1));
    const transportationNo = calculateRowQuantity(transportation, report.groupSize);
    const row: CostRow = {
      id: crypto.randomUUID(),
      description: transportation.name,
      rate: transportation.rate,
      no: transportationNo,
      times: transportationTimes,
      total: calculateTransportationTotal(transportation, transportationNo, transportationTimes),
      per_person: transportation.per_person,
      per_day: transportation.per_day,
      one_time: transportation.one_time,
      is_default: transportation.is_default,
      is_editable: transportation.is_editable,
      max_capacity: transportation.max_capacity,
      from_place: transportation.from_place,
      to_place: transportation.to_place
    };
    handleSectionUpdate('transportation', (prev) => ({ ...prev, rows: [...prev.rows, row] }));
    if (onAddTransportation) onAddTransportation(transportation);
  }, [handleSectionUpdate, report.groupSize, onAddTransportation, selectedTrek?.times]);

  const removeRow = useCallback((id: string, sectionId: string) => {
    handleSectionUpdate(sectionId, (prev) => {
      const rowToRemove = prev.rows.find(r => r.id === id);
      if (rowToRemove?.is_compulsory) {
        toast({ variant: "destructive", title: "Error", description: "Compulsory items cannot be deleted." });
        return prev;
      }
      return { ...prev, rows: prev.rows.filter((row) => row.id !== id) };
    });
  }, [handleSectionUpdate, toast]);

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

    const accommodationData = report.accommodation.rows.map(row => ({
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

    if (currentStep === 0 && !report.trekId) {
      return <SelectTrekStep treks={treks || []} selectedTrekId={report.trekId} onSelectTrek={handleTrekSelect} />;
    }
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
          hideAddRow={true}
          onAddExtraService={localOnAddExtraService}
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
          onAddPermit={localOnAddPermit}
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
          hideAddRow={true}
          onAddService={activeStepData.id === 'services' ? localOnAddService : undefined}
          onAddExtraService={activeStepData.id === 'extraDetails' ? localOnAddExtraService : undefined}
          onAddAccommodation={activeStepData.id === 'accommodation' ? localOnAddAccommodation : undefined}
          onAddTransportation={activeStepData.id === 'transportation' ? localOnAddTransportation : undefined}
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
    if (!report.trekId) {
      return [{ label: "Select Trek", isCurrent: true, stepIndex: 0 }];
    }

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


