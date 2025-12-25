"use client";

import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { handleExportPDF, handleExportExcel } from "@/lib/export";

import { Button } from "@/components/ui/shadcn/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb"

import type { Trek, CostRow, SectionState, Report } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/auth";
import { updateExtraInvoice, postExtraInvoice } from '@/lib/api-service';
import { cn, formatCurrency } from '@/lib/utils';

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

const LoadingStep = () => (
    <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const SelectTrekStep = lazy(() => import('@/components/steps/select-trek-step').then(mod => ({ default: mod.SelectTrekStep })));
const FinalStep = lazy(() => import('@/components/steps/final-step').then(mod => ({ default: mod.FinalStep })));
const CostTable = lazy(() => import('@/components/dashboard/cost-table').then(mod => ({ default: mod.CostTable })));

interface ExtraServiceCostingPageProps {
    initialData: Report & { isNew?: boolean };
    treks?: Trek[];
    user?: User | null;
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);

function ExtraServiceCostingPageComponent({ initialData, treks = [], user = null }: ExtraServiceCostingPageProps) {
    const { toast } = useToast();
    const router = useRouter();

    const [report, setReport] = useState<Report>(() => {
        const data = initialData as any;

        // Helper to parsing discounts
        const parseDiscount = (val: any) => Number(val || 0);
        const parseType = (val: any) => val === 'percentage' ? 'percentage' : 'amount';

        // Map Extra Services from API structure (nested params) to flat rows
        let extraRows: CostRow[] = [];
        if (data.extra_services && Array.isArray(data.extra_services)) {
            data.extra_services.forEach((service: any) => {
                if (service.params && Array.isArray(service.params)) {
                    service.params.forEach((param: any) => {
                        extraRows.push({
                            id: crypto.randomUUID(),
                            description: `${service.service_name} - ${param.name}`,
                            rate: Number(param.rate),
                            no: Number(param.numbers),
                            times: Number(param.times),
                            total: calculateExtraServiceTotal(param, Number(param.numbers), Number(param.times)),
                            // Include boolean flags
                            per_person: param.per_person,
                            per_day: param.per_day,
                            one_time: param.one_time,
                            is_default: param.is_default,
                            is_editable: param.is_editable,
                            max_capacity: param.max_capacity,
                            from_place: param.from_place,
                            to_place: param.to_place
                        });
                    });
                }
            });
        }
        // Fallback to existing extraDetails if available
        if (extraRows.length === 0 && initialData.extraDetails?.rows) {
            extraRows = initialData.extraDetails.rows;
        }


        return {
            ...initialData,
            groupSize: Number(initialData.groupSize || 1),
            startDate: initialData.startDate || new Date().toISOString(),
            // Map Service Charge
            serviceCharge: Number(data.service_charge || initialData.serviceCharge || 0),

            // Map Section Discounts
            permits: {
                ...initialData.permits,
                discountValue: parseDiscount(data.permit_discount || initialData.permits?.discountValue),
                discountType: parseType(data.permit_discount_type || initialData.permits?.discountType),
                discountRemarks: data.permit_discount_remarks || initialData.permits?.discountRemarks || ''
            },
            services: {
                ...initialData.services,
                discountValue: parseDiscount(data.service_discount || initialData.services?.discountValue),
                discountType: parseType(data.service_discount_type || initialData.services?.discountType),
                discountRemarks: data.service_discount_remarks || initialData.services?.discountRemarks || ''
            },
            extraDetails: {
                ...initialData.extraDetails,
                rows: extraRows,
                discountValue: parseDiscount(data.extra_service_discount || initialData.extraDetails?.discountValue),
                discountType: parseType(data.extra_service_discount_type || initialData.extraDetails?.discountType),
                discountRemarks: data.extra_service_discount_remarks || initialData.extraDetails?.discountRemarks || ''
            },

            // Map Overall Discount
            overallDiscountValue: parseDiscount(data.overall_discount || initialData.overallDiscountValue),
            overallDiscountType: parseType(data.overall_discount_type || initialData.overallDiscountType),
            overallDiscountRemarks: data.overall_discount_remarks || initialData.overallDiscountRemarks || '',
        };
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const selectedTrek = useMemo(
        () => treks?.find((trek) => trek.id === report.trekId),
        [report.trekId, treks]
    );

    const calculateSectionTotals = useCallback((section: SectionState) => {
        const subtotal = section.rows.reduce((acc, row) => acc + (row.total || 0), 0);
        const discountVal = Number(section.discountValue || 0);
        const discountAmount = section.discountType === 'percentage'
            ? (subtotal * (discountVal / 100))
            : discountVal;
        const total = subtotal - discountAmount;
        return { subtotal: subtotal || 0, total: total || 0, discountAmount: discountAmount || 0 };
    }, []);

    const subtotalBeforeOverallDiscount = useMemo(() => {
        const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
        return sections.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
    }, [report, calculateSectionTotals]);

    const overallDiscountAmount = useMemo(() => {
        const type = report.overallDiscountType || 'amount';
        const value = Number(report.overallDiscountValue || 0);
        const subtotal = Number(subtotalBeforeOverallDiscount || 0);

        return type === 'percentage'
            ? (subtotal * (value / 100))
            : value;
    }, [report.overallDiscountType, report.overallDiscountValue, subtotalBeforeOverallDiscount]);

    const totalCost = useMemo(() => {
        return (subtotalBeforeOverallDiscount || 0) - (overallDiscountAmount || 0);
    }, [subtotalBeforeOverallDiscount, overallDiscountAmount]);

    const totalWithService = useMemo(() => {
        const serviceCharge = Number(report.serviceCharge || 0);
        return totalCost + (totalCost * (serviceCharge / 100));
    }, [totalCost, report.serviceCharge]);

    const handleDetailChange = useCallback((field: keyof Report, value: any) => {
        setReport(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSectionUpdate = useCallback((sectionId: string, updater: (s: SectionState) => SectionState) => {
        setReport(prevReport => {
            const newReport = { ...prevReport };
            if (sectionId === 'permits' || sectionId === 'services' || sectionId === 'extraDetails') {
                console.log(`Updating main section ${sectionId}`, updater(newReport[sectionId as 'permits' | 'services' | 'extraDetails']));
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
                        const rate = Number(newRow.rate || 0);
                        const no = Number(newRow.no || 0);
                        const times = Number(newRow.times || 0);
                        // Calculate using the proper boolean flag logic
                        newRow.total = calculateExtraServiceTotal(newRow, no, times);
                    }
                    return newRow;
                }
                return row;
            })
        }));
    }, [handleSectionUpdate]);

    const handleTrekSelect = useCallback((trekId: string) => {
        const newSelectedTrek = treks?.find(t => t.id === trekId);
        if (!newSelectedTrek) return;

        setReport(prev => ({
            ...prev,
            trekId: newSelectedTrek.id,
            trekName: newSelectedTrek.name,
            permits: {
                ...prev.permits,
                rows: newSelectedTrek.permits?.map(p => ({
                    id: crypto.randomUUID(),
                    description: p.name,
                    rate: p.rate,
                    no: prev.groupSize,
                    times: 1,
                    total: p.rate * prev.groupSize,
                })) || []
            }
        }));
        setCurrentStep(0);
    }, [treks]);

    const getTransformedPayload = useCallback(() => {
        const extraServicesMap = new Map();
        report.extraDetails.rows.forEach(row => {
            // Split the combined description to get service_name and param name
            const parts = row.description.split(' - ');
            const service_name = parts[0] || row.description; // If no separator, use the full description as service_name
            const param_name = parts[1] || row.description; // If no separator, use the full description as param name
            
            if (!extraServicesMap.has(service_name)) {
                extraServicesMap.set(service_name, { service_name: service_name, params: [] });
            }
            extraServicesMap.get(service_name).params.push({
                name: param_name, rate: row.rate, numbers: row.no, times: row.times
            });
        });

        return {
            package: Number(report.parentGroupId || 0),
            status: "draft",
            permits: report.permits.rows.map(row => ({ name: row.description, rate: row.rate, numbers: row.no, times: row.times })),
            services: report.services.rows.map(row => ({ name: row.description, rate: row.rate, numbers: row.no, times: row.times })),
            extra_services: Array.from(extraServicesMap.values()),
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

        try {
            if (initialData.isNew) {
                await postExtraInvoice(report.groupId, payload);
            } else {
                await updateExtraInvoice(report.groupId, payload);
            }

            toast({
                title: "Success!",
                description: `Extra service has been ${initialData.isNew ? 'created' : 'updated'} successfully.`
            });

            if (shouldNavigate) {
                const redirectId = report.parentGroupId || (initialData.isNew ? initialData.groupId : report.groupId);
                router.push(`/payments/${redirectId}`);
            }
            return true;
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as Error).message || "Failed to save extra service"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [getTransformedPayload, initialData, report.groupId, report.parentGroupId, router, toast]);

    const allSteps = useMemo(() => [
        { id: 'permits', name: 'Permits & Food', data: report.permits },
        { id: 'services', name: 'Services', data: report.services },
        // { id: 'extraDetails', name: 'Extra Details', data: report.extraDetails },
        ...report.customSections.map(s => ({ id: s.id, name: s.name, data: s })),
        { id: 'final', name: 'Final Summary' }
    ], [report]);

    // Ensure currentStep is valid when steps change
    React.useEffect(() => {
        if (currentStep >= allSteps.length && allSteps.length > 0) {
            setCurrentStep(allSteps.length - 1);
        }
    }, [allSteps.length, currentStep]);

    const createNewRow = useCallback(() => ({
        id: crypto.randomUUID(),
        description: "",
        rate: 0,
        no: Number(report.groupSize),
        times: 1,
        total: 0
    }), [report.groupSize]);

    const renderStepContent = () => {
        if (currentStep === 0 && !report.trekId) {
            return <SelectTrekStep treks={treks} selectedTrekId={report.trekId} onSelectTrek={handleTrekSelect} />;
        }

        // Safety check for HMR or state inconsistency
        if (!allSteps[currentStep]) {
            return <LoadingStep />;
        }

        const activeStep = allSteps[currentStep];
        if (activeStep.id === 'final') {
            return (
                <FinalStep
                    extraDetailsState={report.extraDetails}
                    onRowChange={handleRowChange}
                    onDiscountTypeChange={(sectionId, type) => handleSectionUpdate(sectionId, (s) => ({ ...s, discountType: type }))}
                    onDiscountValueChange={(sectionId, value) => handleSectionUpdate(sectionId, (s) => ({ ...s, discountValue: value }))}
                    onDiscountRemarksChange={(sectionId, remarks) => handleSectionUpdate(sectionId, (s) => ({ ...s, discountRemarks: remarks }))}
                    onAddRow={() => handleSectionUpdate('extraDetails', (prev) => ({ ...prev, rows: [...prev.rows, createNewRow()] }))}
                    onRemoveRow={(id) => handleSectionUpdate('extraDetails', (prev) => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) }))}
                    onExportPDF={async () => {
                        if (!selectedTrek) return;
                        try {
                            await handleExportPDF({
                                selectedTrek,
                                report: report as any,
                                calculateSectionTotals,
                                userName: user?.name,
                                includeServiceCharge: true,
                            });
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                    onExportExcel={async () => {
                        try {
                            await handleExportExcel({ report: report as any, calculateSectionTotals });
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                    totalCost={totalCost}
                    subtotalBeforeOverallDiscount={subtotalBeforeOverallDiscount}
                    overallDiscountType={report.overallDiscountType || 'amount'}
                    overallDiscountValue={report.overallDiscountValue || 0}
                    overallDiscountAmount={Number(overallDiscountAmount || 0)}
                    overallDiscountRemarks={report.overallDiscountRemarks || ''}
                    onOverallDiscountTypeChange={(type) => handleDetailChange('overallDiscountType', type)}
                    onOverallDiscountValueChange={(val) => handleDetailChange('overallDiscountValue', val)}
                    onOverallDiscountRemarksChange={(remarks) => handleDetailChange('overallDiscountRemarks', remarks)}

                    groupSize={Number(report.groupSize) || 1}
                    onGroupSizeChange={(size) => handleDetailChange('groupSize', size)}
                    serviceCharge={Number(report.serviceCharge)}
                    setServiceCharge={(val) => handleDetailChange('serviceCharge', val)}
                    includeServiceChargeInPdf={true}
                    setIncludeServiceChargeInPdf={() => { }}
                    isSubmitting={isSaving}
                    onSubmit={() => handleSaveOrUpdate(true)}
                />
            );
        }

        return (
            <CostTable
                section={activeStep.data as any}
                onRowChange={handleRowChange}
                onAddRow={() => handleSectionUpdate(activeStep.id, (prev) => ({ ...prev, rows: [...prev.rows, createNewRow()] }))}
                onRemoveRow={(id) => handleSectionUpdate(activeStep.id, (prev) => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) }))}
                onDiscountTypeChange={(_, type) => {
                    console.log('Discount type changing:', type);
                    handleSectionUpdate(activeStep.id, (s) => ({ ...s, discountType: type as any }));
                }}
                onDiscountValueChange={(_, val) => {
                    console.log('Discount value changing:', val);
                    handleSectionUpdate(activeStep.id, (s) => ({ ...s, discountValue: Number(val) }));
                }}
                onDiscountRemarksChange={(_, rem) => handleSectionUpdate(activeStep.id, (s) => ({ ...s, discountRemarks: rem }))}
            />
        );
    };

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/reports">Reports</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{initialData.isNew ? 'New Additional Service' : 'Edit Additional Service'}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-3xl font-bold mt-2 text-primary">{report.trekName || 'Additional Service'}</h1>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </div>

            <div className="flex overflow-x-auto pb-4 mb-8 gap-4 no-scrollbar border-b">
                {allSteps.map((step, index) => (
                    <button
                        key={step.id}
                        onClick={() => report.trekId && setCurrentStep(index)}
                        className={cn(
                            "whitespace-nowrap pb-2 px-1 text-sm font-medium transition-colors border-b-2",
                            currentStep === index
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {step.name}
                    </button>
                ))}
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6 mb-8">
                <Suspense fallback={<LoadingStep />}>
                    {renderStepContent()}
                </Suspense>
            </div>

            <div className="flex justify-between items-center bg-background/80 backdrop-blur-sm sticky bottom-0 py-4 border-t z-10">
                <div className="text-lg font-bold">
                    Total: <span className="text-primary">{formatCurrency(totalWithService)}</span>
                </div>
                <div className="flex gap-2">
                    {currentStep > 0 && (
                        <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                        </Button>
                    )}
                    {currentStep < allSteps.length - 1 ? (
                        <>
                            <Button variant="outline" onClick={() => handleSaveOrUpdate(false)} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                                Next <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => handleSaveOrUpdate(true)} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckIcon className="h-4 w-4 mr-2" /> Finish
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export const ExtraServiceCostingPage = React.memo(ExtraServiceCostingPageComponent);
