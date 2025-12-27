"use client";

import { memo, useState, useEffect } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Loader2 } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";
import { FileDown, DollarSign, Percent } from 'lucide-react';
import { CostTable } from "@/components/dashboard/cost-table";
import { Checkbox } from '../ui/shadcn/checkbox';
import { Textarea } from "@/components/ui/shadcn/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";

interface FinalStepProps {
    extraDetailsState: SectionState;
    accommodationState?: SectionState;
    transportationState?: SectionState;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountTypeChange: (sectionId: string, type: 'amount' | 'percentage') => void;
    onDiscountValueChange: (sectionId: string, value: number) => void;
    onDiscountRemarksChange?: (sectionId: string, remarks: string) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
    totalCost: number;
    subtotalBeforeOverallDiscount: number;
    overallDiscountType: 'amount' | 'percentage';
    overallDiscountValue: number;
    overallDiscountAmount: number;
    overallDiscountRemarks: string;
    onOverallDiscountTypeChange?: (type: 'amount' | 'percentage') => void;
    onOverallDiscountValueChange?: (value: number) => void;
    onOverallDiscountRemarksChange?: (remarks: string) => void;
    groupSize: number;
    onGroupSizeChange?: (size: number) => void;
    serviceCharge: number;
    setServiceCharge: (value: number) => void;
    includeServiceChargeInPdf: boolean;
    setIncludeServiceChargeInPdf: (value: boolean) => void;
    clientCommunicationMethod?: string;
    onClientCommunicationMethodChange?: (method: string) => void;
    isSubmitting: boolean;
    onSubmit: () => void;
    isRateReadOnly?: boolean;
    hideAddRow?: boolean;
    // Additional props for extra services section
    onAddExtraService?: (extraService: any) => void;
    allExtraServices?: any[];
    isLoadingAllExtraServices?: boolean;
}

function FinalStepComponent({
    extraDetailsState,
    accommodationState,
    transportationState,
    onRowChange,
    onDiscountTypeChange,
    onDiscountValueChange,
    onDiscountRemarksChange = () => { },
    onAddRow,
    onRemoveRow,
    onExportPDF,
    onExportExcel,
    totalCost,
    subtotalBeforeOverallDiscount,
    overallDiscountType,
    overallDiscountValue,
    overallDiscountAmount,
    overallDiscountRemarks,
    onOverallDiscountTypeChange = () => { },
    onOverallDiscountValueChange = () => { },
    onOverallDiscountRemarksChange = () => { },
    groupSize,
    onGroupSizeChange,
    serviceCharge,
    setServiceCharge,
    includeServiceChargeInPdf,
    setIncludeServiceChargeInPdf,
    clientCommunicationMethod = '',
    onClientCommunicationMethodChange = () => { },
    isSubmitting,
    onSubmit,
    isRateReadOnly = false,
    hideAddRow = false,
    onAddExtraService,
    allExtraServices,
    isLoadingAllExtraServices
}: FinalStepProps) {
    const totalWithService = totalCost + (totalCost * (serviceCharge / 100));
    const costPerPersonWithoutService = groupSize > 0 ? totalCost / groupSize : 0;
    const costPerPersonWithService = groupSize > 0 ? totalWithService / groupSize : 0;

    const [localOverallDiscount, setLocalOverallDiscount] = useState(overallDiscountValue?.toString() || '');
    const [localServiceCharge, setLocalServiceCharge] = useState(serviceCharge?.toString() || '');
    const [localGroupSize, setLocalGroupSize] = useState(groupSize?.toString() || '1');

    useEffect(() => {
        setLocalOverallDiscount(overallDiscountValue?.toString() || '');
    }, [overallDiscountValue]);

    useEffect(() => {
        setLocalServiceCharge(serviceCharge?.toString() || '');
    }, [serviceCharge]);

    useEffect(() => {
        setLocalGroupSize(groupSize?.toString() || '1');
    }, [groupSize]);

    return (
        <div className="space-y-8">
            <CostTable
                section={extraDetailsState}
                isCustom
                isDescriptionEditable
                isDescriptionInlineEditable
                onRowChange={onRowChange}
                onDiscountTypeChange={onDiscountTypeChange}
                onDiscountValueChange={onDiscountValueChange}
                onDiscountRemarksChange={onDiscountRemarksChange}
                onAddRow={onAddRow}
                onRemoveRow={onRemoveRow}
                isRateReadOnly={isRateReadOnly}
                hideAddRow={hideAddRow}
                // Additional props for extra services section
                onAddExtraService={onAddExtraService}
                allExtraServices={allExtraServices}
                isLoadingAllExtraServices={isLoadingAllExtraServices}
            />


            <Card>
                <CardHeader>
                    <CardTitle>Final Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="pax-input">Number of People (Pax)</Label>
                            <Input
                                id="pax-input"
                                type="number"
                                value={localGroupSize}
                                onChange={(e) => {
                                    setLocalGroupSize(e.target.value);
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && onGroupSizeChange) {
                                        onGroupSizeChange(val);
                                    }
                                }}
                                className="mt-2 font-semibold"
                                min={1}
                            />
                        </div>

                        {/* Overall Discount Section */}
                        <div>
                            <Label htmlFor="overall-discount">Overall Discount</Label>
                            <div className="mt-2 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ToggleGroup
                                        type="single"
                                        value={overallDiscountType}
                                        onValueChange={(value: 'amount' | 'percentage') => value && onOverallDiscountTypeChange?.(value)}
                                        aria-label="Overall discount type"
                                    >
                                        <ToggleGroupItem value="amount" aria-label="Amount" className="h-9 w-9 p-0 data-[state=on]:bg-primary/20">
                                            <DollarSign className="h-4 w-4" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="percentage" aria-label="Percentage" className="h-9 w-9 p-0 data-[state=on]:bg-primary/20">
                                            <Percent className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                    <Input
                                        type="number"
                                        id="overall-discount"
                                        value={localOverallDiscount}
                                        onChange={e => {
                                            setLocalOverallDiscount(e.target.value);
                                            const val = parseFloat(e.target.value);
                                            onOverallDiscountValueChange?.(!isNaN(val) ? val : 0);
                                        }}
                                        className="flex-1"
                                        placeholder="0.00"
                                    />
                                </div>
                                <Input
                                    type="text"
                                    id="overall-discount-remarks"
                                    value={overallDiscountRemarks ?? ''}
                                    onChange={e => onOverallDiscountRemarksChange?.(e.target.value)}
                                    placeholder="Discount remarks..."
                                />
                                {overallDiscountAmount > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        Discount Applied: <span className="font-medium">- {formatCurrency(overallDiscountAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="service-charge">Service Charge (%)</Label>
                            <Input
                                id="service-charge"
                                type="number"
                                value={localServiceCharge}
                                onChange={(e) => {
                                    setLocalServiceCharge(e.target.value);
                                    const val = parseFloat(e.target.value);
                                    setServiceCharge(!isNaN(val) ? val : 0);
                                }}
                                placeholder="e.g., 10"
                                className="mt-2"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="include-service-charge"
                                checked={includeServiceChargeInPdf}
                                onCheckedChange={(checked) => setIncludeServiceChargeInPdf(Boolean(checked))}
                            />
                            <Label htmlFor="include-service-charge">Include Service Charge in PDF</Label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm text-muted-foreground">Subtotal (before overall discount)</span>
                            <span className="font-bold">{formatCurrency(subtotalBeforeOverallDiscount)}</span>
                        </div>
                        {overallDiscountAmount > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                                <span className="text-sm text-amber-700 dark:text-amber-300">
                                    Overall Discount {overallDiscountType === 'percentage' ? `(${overallDiscountValue}%)` : ''}
                                </span>
                                <span className="font-bold text-amber-700 dark:text-amber-300">- {formatCurrency(overallDiscountAmount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm text-muted-foreground">Total after overall discount</span>
                            <span className="font-bold">{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm text-muted-foreground">Total w/ service ({serviceCharge}%)</span>
                            <span className="font-bold">{formatCurrency(totalWithService)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 text-primary">
                            <span className="text-sm font-medium">Cost per person (after discount, no service)</span>
                            <span className="font-bold">{formatCurrency(costPerPersonWithoutService)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 text-primary">
                            <span className="text-sm font-medium">Cost per person (after discount, w/ service)</span>
                            <span className="font-bold">{formatCurrency(costPerPersonWithService)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export const FinalStep = memo(FinalStepComponent);
