
import React from 'react';
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
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";

interface CostTableProps {
    section: SectionState;
    usePax: boolean;
    onSetUsePax: (sectionId: string, value: boolean) => void;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountChange: (sectionId: string, value: number) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    isCustom?: boolean;
    isDescriptionEditable?: boolean;
    onEditSection?: (section: SectionState) => void;
    onRemoveSection?: (sectionId: string) => void;
}

export const CostTable = React.memo(function CostTable({
    section,
    usePax,
    onSetUsePax,
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

    const { total } = calculateSectionTotals(section);

    return (
        <Card className="shadow-none border-none">
            <CardHeader className="flex flex-row items-center justify-between px-0 mb-4">
                <CardTitle>{section.name}</CardTitle>
                <div className="flex items-center gap-4">
                    {isCustom && onEditSection && (
                         <Button variant="ghost" size="icon" onClick={() => onEditSection(section)}>
                            <Edit className="h-4 w-4" />
                             <span className="sr-only">Edit section name</span>
                        </Button>
                    )}
                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`pax-switch-${section.id}`} className="text-sm font-medium">Use Pax?</Label>
                        <Switch id={`pax-switch-${section.id}`} checked={usePax} onCheckedChange={(checked) => onSetUsePax(section.id, checked)} />
                    </div>
                    {isCustom && onRemoveSection && (
                        <Button variant="ghost" size="icon" onClick={() => onRemoveSection(section.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove section</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="min-w-[250px]">Description</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>No.</TableHead>
                            <TableHead>Times</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-20 text-center">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {section.rows.map((row, index) => (
                            <TableRow key={row.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                                {isDescriptionEditable ? (
                                <Input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => onRowChange(row.id, 'description', e.target.value, section.id)}
                                    className="w-full bg-transparent border-0 focus-visible:ring-0"
                                    placeholder="Enter item description"
                                />
                                ) : (
                                row.description
                                )}
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.rate} onChange={e => onRowChange(row.id, 'rate', Number(e.target.value), section.id)} className="w-24 bg-transparent border-0 focus-visible:ring-0"/>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.no} onChange={e => onRowChange(row.id, 'no', Number(e.target.value), section.id)} className="w-20 bg-transparent border-0 focus-visible:ring-0" disabled={usePax} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={row.times} onChange={e => onRowChange(row.id, 'times', Number(e.target.value), section.id)} className="w-20 bg-transparent border-0 focus-visible:ring-0"/>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => onRemoveRow(row.id, section.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Remove row</span>
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="mt-6">
                    <Button onClick={() => onAddRow(section.id)} variant="outline" className="w-full border-dashed border-primary text-primary hover:text-primary hover:bg-primary/5">
                        <Plus className="h-4 w-4 mr-2" /> Add New Row
                    </Button>
                </div>
                <div className="mt-6 flex flex-col md:flex-row items-end justify-between gap-6">
                     <div className="w-full md:w-auto md:min-w-64 space-y-4 ml-auto">
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
                        <div className="flex justify-between font-bold text-lg">
                            <span>In total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
