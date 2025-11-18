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
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";
import { FileDown, Mail, MessageSquare } from 'lucide-react';
import { CostTable } from "@/components/dashboard/cost-table";
import { Checkbox } from '../ui/shadcn/checkbox';


interface FinalStepProps {
    extraDetailsState: SectionState;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountTypeChange: (sectionId: string, type: 'amount' | 'percentage') => void;
    onDiscountValueChange: (sectionId: string, value: number) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
    totalCost: number;
    usePax: boolean;
    onSetUsePax: (sectionId: string, value: boolean) => void;
    groupSize: number;
    serviceCharge: number;
    setServiceCharge: (value: number) => void;
    includeServiceChargeInPdf: boolean;
    setIncludeServiceChargeInPdf: (value: boolean) => void;
}

function FinalStepComponent({
    extraDetailsState,
    onRowChange,
    onDiscountTypeChange,
    onDiscountValueChange,
    onAddRow,
    onRemoveRow,
    onExportPDF,
    onExportExcel,
    totalCost,
    usePax,
    onSetUsePax,
    groupSize,
    serviceCharge,
    setServiceCharge,
    includeServiceChargeInPdf,
    setIncludeServiceChargeInPdf
}: FinalStepProps) {

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
                onAddRow={onAddRow}
                onRemoveRow={onRemoveRow}
                usePax={usePax}
                onSetUsePax={onSetUsePax}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Client Communication Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox id="send-email" />
                        <div className="grid gap-1.5 leading-none">
                            <label
                            htmlFor="send-email"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                            <Mail className="h-4 w-4" /> Client communicated via Email
                            </label>
                            <p className="text-sm text-muted-foreground">
                            Check this box to mark that the client made contact through email.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox id="send-whatsapp" />
                        <div className="grid gap-1.5 leading-none">
                            <label
                            htmlFor="send-whatsapp"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                            <MessageSquare className="h-4 w-4" /> Client communicated via WhatsApp
                            </label>
                            <p className="text-sm text-muted-foreground">
                            Check this box to mark that the client made contact through WhatsApp.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            <span className="text-sm text-muted-foreground">Group Total w/o service</span>
                            <span className="font-bold">{formatCurrency(totalCost)}</span>
                        </div>
                         <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm text-muted-foreground">Group Total w/ service ({serviceCharge}%)</span>
                            <span className="font-bold">{formatCurrency(totalWithService)}</span>
                        </div>
                         <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 text-primary">
                            <span className="text-sm font-medium">Cost per person w/o service</span>
                            <span className="font-bold">{formatCurrency(costPerPersonWithoutService)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3 text-primary">
                            <span className="text-sm font-medium">Cost per person w/ service</span>
                            <span className="font-bold">{formatCurrency(costPerPersonWithService)}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col sm:flex-row sm:flex-wrap justify-end gap-2 pt-6">
                    <Button onClick={onExportPDF} variant="outline" className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4"/> Export PDF</Button>
                    <Button onClick={onExportExcel} variant="outline" className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4"/> Export Excel</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export const FinalStep = memo(FinalStepComponent);
