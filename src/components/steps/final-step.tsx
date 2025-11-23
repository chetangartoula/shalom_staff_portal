"use client";

import { memo } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Separator } from "@/components/ui/shadcn/separator";
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";
import { FileDown, DollarSign, Percent } from 'lucide-react';
import { CostTable } from "@/components/dashboard/cost-table";
import { Checkbox } from '../ui/shadcn/checkbox';
import { Textarea } from "@/components/ui/shadcn/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";

interface FinalStepProps {
    extraDetailsState: SectionState;
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
    serviceCharge: number;
    setServiceCharge: (value: number) => void;
    includeServiceChargeInPdf: boolean;
    setIncludeServiceChargeInPdf: (value: boolean) => void;
    clientCommunicationMethod?: string;
    onClientCommunicationMethodChange?: (method: string) => void;
}

function FinalStepComponent({
    extraDetailsState,
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
    serviceCharge,
    setServiceCharge,
    includeServiceChargeInPdf,
    setIncludeServiceChargeInPdf,
    clientCommunicationMethod = '',
    onClientCommunicationMethodChange = () => { }
}: FinalStepProps) {

    // Handle communication method changes
    const handleCommunicationMethodChange = (method: string, checked: boolean) => {
        if (!onClientCommunicationMethodChange) return;

        let newMethods = clientCommunicationMethod ? clientCommunicationMethod.split(',').map(m => m.trim()) : [];

        if (checked) {
            if (!newMethods.includes(method)) {
                newMethods.push(method);
            }
        } else {
            newMethods = newMethods.filter(m => m !== method);
        }

        onClientCommunicationMethodChange(newMethods.join(', '));
    };

    // Check if a method is selected
    const isMethodSelected = (method: string) => {
        if (!clientCommunicationMethod) return false;
        return clientCommunicationMethod.split(',').map(m => m.trim()).includes(method);
    };

    const totalWithService = totalCost * (1 + serviceCharge / 100);
    const costPerPersonWithoutService = groupSize > 0 ? totalCost / groupSize : 0;
    const costPerPersonWithService = groupSize > 0 ? totalWithService / groupSize : 0;

    return (
        <div className="space-y-8">
            <CostTable
                section={extraDetailsState}
                isCustom
                isDescriptionEditable
                onRowChange={onRowChange}
                onDiscountTypeChange={onDiscountTypeChange}
                onDiscountValueChange={onDiscountValueChange}
                onDiscountRemarksChange={onDiscountRemarksChange}
                onAddRow={onAddRow}
                onRemoveRow={onRemoveRow}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Final Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="pax-display">Number of People (Pax)</Label>
                            <div id="pax-display" className="mt-2 text-lg font-semibold rounded-md border bg-muted px-3 py-2">{groupSize}</div>
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
                                        value={overallDiscountValue ?? 0}
                                        onChange={e => onOverallDiscountValueChange?.(Number(e.target.value))}
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
                                value={serviceCharge}
                                onChange={(e) => setServiceCharge(Number(e.target.value))}
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
                <CardFooter className="flex-col sm:flex-row sm:flex-wrap justify-end gap-2 pt-6">
                    <Button onClick={onExportPDF} variant="outline" className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
                    <Button onClick={onExportExcel} variant="outline" className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4" /> Export Excel</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export const FinalStep = memo(FinalStepComponent);
