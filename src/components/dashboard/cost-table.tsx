import React, { memo } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { Label } from "@/components/ui/shadcn/label";
import { Separator } from "@/components/ui/shadcn/separator";
import { Switch } from "@/components/ui/shadcn/switch";
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";
import { Edit, Trash2, Plus, Percent, DollarSign } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";
import { cn } from '@/lib/utils';

interface CostTableProps {
    section: SectionState;
    usePax: boolean;
    onSetUsePax: (sectionId: string, value: boolean) => void;
    onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
    onDiscountTypeChange: (sectionId: string, type: 'amount' | 'percentage') => void;
    onDiscountValueChange: (sectionId: string, value: number) => void;
    onAddRow: (sectionId: string) => void;
    onRemoveRow: (id: string, sectionId: string) => void;
    isCustom?: boolean;
    isDescriptionEditable?: boolean;
    onEditSection?: (section: SectionState) => void;
    onRemoveSection?: (sectionId: string) => void;
}

function CostTableComponent({
    section,
    usePax,
    onSetUsePax,
    onRowChange,
    onDiscountTypeChange,
    onDiscountValueChange,
    onAddRow,
    onRemoveRow,
    isCustom = false,
    isDescriptionEditable = false,
    onEditSection,
    onRemoveSection,
}: CostTableProps) {

    const calculateSectionTotals = (currentSection: SectionState) => {
        const subtotal = currentSection.rows.reduce((acc, row) => acc + row.total, 0);
        const discountAmount = currentSection.discountType === 'percentage'
            ? (subtotal * (currentSection.discountValue / 100))
            : currentSection.discountValue;
        const total = subtotal - discountAmount;
        return { subtotal, total, discountAmount };
    };

    const { subtotal, total, discountAmount } = calculateSectionTotals(section);

    const renderDesktopTable = () => (
      <div className="overflow-x-auto rounded-lg border hidden md:block">
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
                          className="w-full bg-transparent border-0 focus-visible:ring-0 px-0"
                          placeholder="Enter item description"
                      />
                      ) : (
                      row.description
                      )}
                  </TableCell>
                  <TableCell>
                      <Input type="number" value={row.rate} onChange={e => onRowChange(row.id, 'rate', Number(e.target.value), section.id)} className="w-24 bg-transparent border-0 focus-visible:ring-0 px-0"/>
                  </TableCell>
                  <TableCell>
                      <Input type="number" value={row.no} onChange={e => onRowChange(row.id, 'no', Number(e.target.value), section.id)} className="w-20 bg-transparent border-0 focus-visible:ring-0 px-0" disabled={usePax} />
                  </TableCell>
                  <TableCell>
                      <Input type="number" value={row.times} onChange={e => onRowChange(row.id, 'times', Number(e.target.value), section.id)} className="w-20 bg-transparent border-0 focus-visible:ring-0 px-0"/>
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
    );
    
    const renderMobileCards = () => (
      <div className="space-y-4 md:hidden">
        {section.rows.map((row, index) => (
          <Card key={row.id} className="relative">
            <CardHeader>
              <CardTitle className="text-base truncate">{row.description || `Item ${index + 1}`}</CardTitle>
               <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => onRemoveRow(row.id, section.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Remove row</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
               {isDescriptionEditable && (
                  <div className="space-y-1">
                      <Label htmlFor={`desc-${row.id}`}>Description</Label>
                      <Input id={`desc-${row.id}`} type="text" value={row.description} onChange={(e) => onRowChange(row.id, 'description', e.target.value, section.id)} placeholder="Enter item description" />
                  </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor={`rate-${row.id}`}>Rate</Label>
                      <Input id={`rate-${row.id}`} type="number" value={row.rate} onChange={e => onRowChange(row.id, 'rate', Number(e.target.value), section.id)} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor={`no-${row.id}`}>No.</Label>
                      <Input id={`no-${row.id}`} type="number" value={row.no} onChange={e => onRowChange(row.id, 'no', Number(e.target.value), section.id)} disabled={usePax} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor={`times-${row.id}`}>Times</Label>
                      <Input id={`times-${row.id}`} type="number" value={row.times} onChange={e => onRowChange(row.id, 'times', Number(e.target.value), section.id)} />
                  </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted p-4 justify-between">
                <span className="font-medium text-muted-foreground">Row Total</span>
                <span className="font-bold">{formatCurrency(row.total)}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-2xl">{section.name}</CardTitle>
                <div className="flex items-center gap-4 self-start md:self-center">
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
            <CardContent>
                {renderDesktopTable()}
                {renderMobileCards()}

                 <div className="mt-6">
                    <Button onClick={() => onAddRow(section.id)} variant="outline" className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" /> Add New Row
                    </Button>
                </div>
                <div className="mt-6 flex flex-col md:flex-row items-end justify-between gap-6">
                     <div className="w-full md:w-auto md:min-w-80 space-y-4 ml-auto">
                        <div className="flex items-center justify-between gap-4">
                            <Label className="shrink-0">Subtotal</Label>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                         <div className="flex items-center justify-between gap-4">
                            <Label htmlFor={`discount-${section.id}`} className="shrink-0">Discount</Label>
                            <div className="flex items-center gap-2">
                                <ToggleGroup 
                                    type="single" 
                                    value={section.discountType}
                                    onValueChange={(value: 'amount' | 'percentage') => value && onDiscountTypeChange(section.id, value)}
                                    aria-label="Discount type"
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
                                    id={`discount-${section.id}`} 
                                    value={section.discountValue} 
                                    onChange={e => onDiscountValueChange(section.id, Number(e.target.value))} 
                                    className="w-full max-w-32"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
                                <span>Discount Applied:</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Section Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const CostTable = memo(CostTableComponent);
