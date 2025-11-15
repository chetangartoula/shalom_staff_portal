import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { SectionState, CostRow } from "@/lib/types";
import { CostTable } from "@/components/cost-table";

interface FinalStepProps {
    extraDetailsState: SectionState;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountChange: (sectionId: string, value: number) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    onEditSection: (section: SectionState) => void;
    onRemoveSection: (sectionId: string) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
    permitsTotal: number;
    servicesTotal: number;
    customSectionsTotals: any[];
    totalCost: number;
}

export function FinalStep({
    extraDetailsState,
    onRowChange,
    onDiscountChange,
    onAddRow,
    onRemoveRow,
    onEditSection,
    onRemoveSection,
    onExportPDF,
    onExportExcel,
    permitsTotal,
    servicesTotal,
    customSectionsTotals,
    totalCost
}: FinalStepProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
                <CardDescription>Review your trek costs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-lg border p-4">
                    <div>
                        <h3 className="font-semibold text-muted-foreground">PERMITS TOTAL</h3>
                        <p className="text-2xl font-bold">{formatCurrency(permitsTotal)}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-muted-foreground">SERVICES TOTAL</h3>
                        <p className="text-2xl font-bold">{formatCurrency(servicesTotal)}</p>
                    </div>
                    {customSectionsTotals.map(sec => (
                        <div key={sec.id}>
                            <h3 className="font-semibold text-muted-foreground uppercase">{sec.name} TOTAL</h3>
                            <p className="text-2xl font-bold">{formatCurrency(sec.total)}</p>
                        </div>
                    ))}
                </div>
                <Separator />
                <CostTable 
                    title="Extra Details"
                    section={extraDetailsState}
                    isCustom
                    isDescriptionEditable
                    onRowChange={onRowChange}
                    onDiscountChange={onDiscountChange}
                    onAddRow={onAddRow}
                    onRemoveRow={onRemoveRow}
                    onEditSection={onEditSection}
                    onRemoveSection={onRemoveSection}
                />
                <Separator />
                <div className="flex justify-between items-center text-xl font-bold text-primary p-4 bg-primary/5 rounded-lg">
                    <span>Final Cost:</span> 
                    <span>{formatCurrency(totalCost)}</span>
                </div>
            </CardContent>
            <CardFooter className="flex-wrap justify-end gap-2">
                <Button onClick={onExportPDF}><FileDown /> Export PDF</Button>
                <Button onClick={onExportExcel}><FileDown /> Export Excel</Button>
            </CardFooter>
        </Card>
    );
}
