"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Trash2, Plus, Edit, Save, X, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import type { CostRow, SectionState } from "@/lib/types";
import { Checkbox } from '../ui/shadcn/checkbox';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/shadcn/toggle-group";

interface CostTableProps {
  section: SectionState;
  usePax?: boolean;
  onSetUsePax?: (sectionId: string, value: boolean) => void;
  isCustom?: boolean;
  isDescriptionEditable?: boolean;
  isReadOnly?: boolean; // New prop to make the table read-only
  onRowChange: (id: string, field: keyof CostRow, value: any, sectionId: string) => void;
  onDiscountTypeChange: (sectionId: string, type: 'amount' | 'percentage') => void;
  onDiscountValueChange: (sectionId: string, value: number) => void;
  onDiscountRemarksChange?: (sectionId: string, remarks: string) => void;
  onAddRow?: (sectionId: string) => void;
  onRemoveRow?: (id: string, sectionId: string) => void;
  isRateReadOnly?: boolean;
  hideAddRow?: boolean;
  onEditSection?: (section: SectionState) => void;
  onRemoveSection?: (sectionId: string) => void;
}

export function CostTable({
  section,
  usePax = false,
  onSetUsePax = () => { },
  isCustom = false,
  isDescriptionEditable = true,
  isReadOnly = false,
  onRowChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onDiscountRemarksChange = () => { },
  onAddRow,
  onRemoveRow,
  onEditSection,
  onRemoveSection,
  isRateReadOnly = false,
  hideAddRow = false
}: CostTableProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  const handleEditRow = (row: CostRow) => {
    setEditingRowId(row.id);
    setTempDescription(row.description);
  };

  const handleSaveEdit = (rowId: string) => {
    onRowChange(rowId, 'description', tempDescription, section.id);
    setEditingRowId(null);
    setTempDescription('');
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setTempDescription('');
  };

  const calculateSectionTotals = () => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const discountAmount = section.discountType === 'percentage'
      ? (subtotal * (section.discountValue / 100))
      : section.discountValue;
    const total = subtotal - discountAmount;
    return { subtotal, total, discountAmount };
  };

  const totals = calculateSectionTotals();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{section.name}</h2>
          {isCustom && onEditSection && !isReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditSection(section)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isCustom && onRemoveSection && !isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveSection(section.id)}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove Section
          </Button>
        )}
      </div>


      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Rate</th>
              <th className="text-right p-4 font-medium text-muted-foreground">No.</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Times</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
              {!isReadOnly && (
                <th className="p-4 font-medium text-muted-foreground w-20"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/50">
                <td className="p-4">
                  {editingRowId === row.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveEdit(row.id)}
                        className="h-8 w-8"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{row.description}</span>
                      {isDescriptionEditable && !isReadOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRow(row)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <Input
                    type="number"
                    value={row.rate || 0}
                    onChange={(e) => onRowChange(row.id, 'rate', Number(e.target.value), section.id)}
                    className="text-right"
                    readOnly={isReadOnly || isRateReadOnly}
                    disabled={isReadOnly || isRateReadOnly}
                  />
                </td>
                <td className="p-4">
                  <Input
                    type="number"
                    value={row.no || 0}
                    onChange={(e) => onRowChange(row.id, 'no', Number(e.target.value), section.id)}
                    className="text-right"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </td>
                <td className="p-4">
                  <Input
                    type="number"
                    value={row.times || 0}
                    onChange={(e) => onRowChange(row.id, 'times', Number(e.target.value), section.id)}
                    className="text-right"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </td>
                <td className="p-4 text-right font-medium">
                  {formatCurrency(row.total || 0)}
                </td>
                {!isReadOnly && (
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveRow && onRemoveRow(row.id, section.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <div className="space-y-4">
          {!hideAddRow && (
            <Button onClick={() => onAddRow && onAddRow(section.id)} variant="outline" className="border-dashed w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
          )}

          <div className="bg-muted/30 p-4 rounded-lg border border-dashed space-y-4">
            <Label className="text-base font-semibold">Discount</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={section.discountType}
                  onValueChange={(value: 'amount' | 'percentage') => value && onDiscountTypeChange(section.id, value)}
                  aria-label="Discount type"
                  className="justify-start"
                >
                  <ToggleGroupItem value="amount" aria-label="Amount" className="h-10 w-10 p-0 data-[state=on]:bg-primary/20">
                    <DollarSign className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="percentage" aria-label="Percentage" className="h-10 w-10 p-0 data-[state=on]:bg-primary/20">
                    <Percent className="h-5 w-5" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Input
                  type="number"
                  value={section.discountValue ?? 0}
                  onChange={(e) => onDiscountValueChange(section.id, Number(e.target.value))}
                  placeholder="0.00"
                  className="w-24"
                />
              </div>
              <Input
                type="text"
                value={section.discountRemarks ?? ''}
                onChange={(e) => onDiscountRemarksChange(section.id, e.target.value)}
                placeholder="Discount remarks..."
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-amber-700 dark:text-amber-300">
              <span>Discount ({section.discountType === 'percentage' ? `${section.discountValue}%` : formatCurrency(section.discountValue)}):</span>
              <span className="font-medium">- {formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}