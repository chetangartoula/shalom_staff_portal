import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/app/cost-matrix-page";

interface CostTableProps {
    title: string;
    section: SectionState;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountChange: (sectionId: string, value: number) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    isCustom?: boolean;
    isDescriptionEditable?: boolean;
    onEditSection?: (section: SectionState) => void;
    onRemoveSection?: (sectionId: string) => void;
}

export function CostTable({
    title,
    section,
    onRowChange,
    onDiscountChange,
    onAddRow,
    onRemoveRow,
    isCustom = false,
    isDescriptionEditable = false,
    onEditSection,
    onRemoveSection,
}: CostTableProps) {

    const calculateSectionTotals = (section: SectionState) => {
        const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
        const total = subtotal - section.discount;
        return { subtotal, total };
    };

    const { subtotal, total } = calculateSectionTotals(section);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                {isCustom && onEditSection && onRemoveSection && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEditSection(section)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemoveSection(section.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/5 min-w-[200px]">Description</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>No.</TableHead>
                            <TableHead>Times</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {section.rows.map((row) => (
                            <TableRow key={row.id}>
                            <TableCell>
                                {isDescriptionEditable ? (
                                <Input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => onRowChange(row.id, 'description', e.target.value, section.id)}
                                    className="w-full"
                                />
                                ) : (
                                row.description
                                )}
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.rate} onChange={e => onRowChange(row.id, 'rate', Number(e.target.value), section.id)} className="w-24"/>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.no} onChange={e => onRowChange(row.id, 'no', Number(e.target.value), section.id)} className="w-20"/>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.times} onChange={e => onRowChange(row.id, 'times', Number(e.target.value), section.id)} className="w-20"/>
                            </TableCell>
                            <TableCell>{formatCurrency(row.total)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => onRemoveRow(row.id, section.id)}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-6 flex flex-col md:flex-row items-start justify-between gap-6">
                    <Button onClick={() => onAddRow(section.id)} variant="outline">
                    <Plus /> Add Row
                    </Button>
                    <div className="w-full md:w-auto md:min-w-64 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={`discount-${section.id}`} className="shrink-0">Discount</Label>
                        <Input 
                            type="number" 
                            id={`discount-${section.id}`} 
                            value={section.discount} 
                            onChange={e => onDiscountChange(section.id, Number(e.target.value))} 
                            className="w-full max-w-32"
                            placeholder="0.00"
                        />
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="text-destructive">- {formatCurrency(section.discount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
