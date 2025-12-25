"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Trash2, Plus, Edit, Save, X, DollarSign, Percent, Loader2 } from 'lucide-react';
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
  // Additional props for permits section
  onAddPermit?: (permit: any) => void;
  allPermits?: any[];
  isLoadingAllPermits?: boolean;
  // Additional props for services section
  onAddService?: (service: any) => void;
  allServices?: any[];
  isLoadingAllServices?: boolean;
  // Additional props for extra services section
  onAddExtraService?: (extraService: any) => void;
  allExtraServices?: any[];
  isLoadingAllExtraServices?: boolean;
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
  hideAddRow = false,
  onAddPermit,
  allPermits,
  isLoadingAllPermits,
  onAddService,
  allServices,
  isLoadingAllServices,
  onAddExtraService,
  allExtraServices,
  isLoadingAllExtraServices
}: CostTableProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [localDiscount, setLocalDiscount] = useState(section.discountValue?.toString() || '');
  const [isAddPermitDialogOpen, setIsAddPermitDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isAddExtraServiceDialogOpen, setIsAddExtraServiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermits, setSelectedPermits] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedExtraServices, setSelectedExtraServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalDiscount(section.discountValue?.toString() || '');
  }, [section.discountValue]);

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

  // Function to enforce max_capacity constraint
  const enforceMaxCapacity = (row: CostRow, newValue: number) => {
    if (row.max_capacity !== undefined && newValue > row.max_capacity) {
      return row.max_capacity;
    }
    return newValue;
  };

  const calculateSectionTotals = () => {
    const subtotal = section.rows.reduce((acc, row) => acc + (row.total || 0), 0);
    const discountVal = Number(section.discountValue || 0);
    console.log(`CostTable: subtotal=${subtotal}, discountVal=${discountVal}, type=${section.discountType}`);
    const discountAmount = section.discountType === 'percentage'
      ? (subtotal * (discountVal / 100))
      : discountVal;
    const total = subtotal - discountAmount;
    return { subtotal: subtotal || 0, total: total || 0, discountAmount: discountAmount || 0 };
  };

  // Filter permits based on search term
  const filteredPermits = allPermits?.filter(permit => {
    const searchLower = searchTerm.toLowerCase();
    return (
      permit.name.toLowerCase().includes(searchLower) ||
      (permit.from_place && permit.from_place.toLowerCase().includes(searchLower)) ||
      (permit.to_place && permit.to_place.toLowerCase().includes(searchLower))
    );
  });
  
  // Filter services based on search term
  const filteredServices = allServices?.filter(service => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      (service.from_place && service.from_place.toLowerCase().includes(searchLower)) ||
      (service.to_place && service.to_place.toLowerCase().includes(searchLower))
    );
  });
  
  // Filter extra services based on search term
  const filteredExtraServices = allExtraServices?.filter(extraService => {
    const searchLower = searchTerm.toLowerCase();
    return (
      extraService.serviceName?.toLowerCase().includes(searchLower) ||
      (extraService.from_place && extraService.from_place.toLowerCase().includes(searchLower)) ||
      (extraService.to_place && extraService.to_place.toLowerCase().includes(searchLower))
    );
  });
  
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Permits button for permits section */}
          {section.id === 'permits' && onAddPermit && (
            <Button onClick={() => setIsAddPermitDialogOpen(true)} variant="outline" className="border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Permits
            </Button>
          )}
          {/* Add Services button for services section */}
          {section.id === 'services' && onAddService && (
            <Button onClick={() => setIsAddServiceDialogOpen(true)} variant="outline" className="border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Services
            </Button>
          )}
          {/* Add Extra Services button for extra services section */}
          {section.id === 'extraDetails' && onAddExtraService && (
            <Button onClick={() => setIsAddExtraServiceDialogOpen(true)} variant="outline" className="border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Extra Services
            </Button>
          )}
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
                    <div className="flex flex-col">
                      <span>{row.description}</span>
                      {row.location && (
                        <span className="text-xs text-muted-foreground">{row.location}</span>
                      )}
                      {isDescriptionEditable && !isReadOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRow(row)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-start"
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
                    readOnly={isReadOnly || isRateReadOnly || (section.id === 'permits' && row.is_editable === false)}
                    disabled={isReadOnly || isRateReadOnly || (section.id === 'permits' && row.is_editable === false)}
                  />
                  {section.id === 'permits' && row.is_editable === false && (
                    <div className="text-xs text-muted-foreground mt-1">Rate is locked</div>
                  )}
                </td>
                <td className="p-4">
                  <Input
                    type="number"
                    value={row.no || 0}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      const finalValue = enforceMaxCapacity(row, newValue);
                      onRowChange(row.id, 'no', finalValue, section.id);
                    }}
                    className="text-right"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                  {row.max_capacity !== undefined && row.no !== undefined && row.no > row.max_capacity && (
                    <div className="text-xs text-red-500 mt-1">Max capacity: {row.max_capacity}</div>
                  )}
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
                  value={localDiscount}
                  onChange={(e) => {
                    setLocalDiscount(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      onDiscountValueChange(section.id, val);
                    } else if (e.target.value === '') {
                      onDiscountValueChange(section.id, 0);
                    }
                  }}
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

      {/* Add Permits Dialog */}
      {section.id === 'permits' && onAddPermit && (
        <Dialog open={isAddPermitDialogOpen} onOpenChange={setIsAddPermitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Permits</DialogTitle>
              <DialogDescription>
                Select permits to add to your cost calculation
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingAllPermits ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading permits...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Input
                  placeholder="Search permits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <div className="grid gap-4 max-h-[calc(96vh-200px)] overflow-y-auto">
                  {filteredPermits && filteredPermits.length > 0 ? (
                    filteredPermits.map((permit) => (
                      <div 
                        key={permit.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{permit.name}</div>
                          {permit.from_place && permit.to_place && (
                            <div className="text-sm text-muted-foreground">{permit.from_place} to {permit.to_place}</div>
                          )}
                          <div className="text-sm text-muted-foreground">Rate: {formatCurrency(parseFloat(permit.rate))}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                            {permit.per_person && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Per Person</span>}
                            {permit.per_day && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Per Day</span>}
                            {permit.one_time && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">One Time</span>}
                            {!permit.per_person && !permit.per_day && !permit.one_time && (
                              <span className="text-muted-foreground italic">Standard</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const newSelected = new Set(selectedPermits);
                            if (selectedPermits.has(permit.id)) {
                              newSelected.delete(permit.id);
                            } else {
                              newSelected.add(permit.id);
                            }
                            setSelectedPermits(newSelected);
                          }}
                          variant="outline"
                          className={selectedPermits.has(permit.id) ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
                        >
                          {selectedPermits.has(permit.id) ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No permits found</p>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                onClick={() => setIsAddPermitDialogOpen(false)}
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Add all selected permits
                  if (allPermits && selectedPermits.size > 0) {
                    const permitsToAdd = allPermits.filter((permit: any) => selectedPermits.has(permit.id));
                    permitsToAdd.forEach(permit => {
                      onAddPermit(permit);
                    });
                  }
                  setIsAddPermitDialogOpen(false);
                  // Clear selected permits
                  setSelectedPermits(new Set());
                }}
                variant="default"
                disabled={selectedPermits.size === 0}
              >
                Add Selected ({selectedPermits.size})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Services Dialog */}
      {section.id === 'services' && onAddService && (
        <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Services</DialogTitle>
              <DialogDescription>
                Select services to add to your cost calculation
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingAllServices ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading services...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <div className="grid gap-4 max-h-[calc(96vh-200px)] overflow-y-auto">
                  {filteredServices && filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <div 
                        key={service.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.from_place && service.to_place && (
                            <div className="text-sm text-muted-foreground">{service.from_place} to {service.to_place}</div>
                          )}
                          <div className="text-sm text-muted-foreground">Rate: {formatCurrency(parseFloat(service.rate))}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                            {service.per_person && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Per Person</span>}
                            {service.per_day && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Per Day</span>}
                            {service.one_time && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">One Time</span>}
                            {!service.per_person && !service.per_day && !service.one_time && (
                              <span className="text-muted-foreground italic">Standard</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const newSelected = new Set(selectedServices);
                            if (selectedServices.has(service.id)) {
                              newSelected.delete(service.id);
                            } else {
                              newSelected.add(service.id);
                            }
                            setSelectedServices(newSelected);
                          }}
                          variant="outline"
                          className={selectedServices.has(service.id) ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
                        >
                          {selectedServices.has(service.id) ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No services found</p>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                onClick={() => setIsAddServiceDialogOpen(false)}
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Add all selected services
                  if (allServices && selectedServices.size > 0) {
                    const servicesToAdd = allServices.filter((service: any) => selectedServices.has(service.id));
                    servicesToAdd.forEach(service => {
                      onAddService(service);
                    });
                  }
                  setIsAddServiceDialogOpen(false);
                  // Clear selected services
                  setSelectedServices(new Set());
                }}
                variant="default"
                disabled={selectedServices.size === 0}
              >
                Add Selected ({selectedServices.size})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Extra Services Dialog */}
      {section.id === 'extraDetails' && onAddExtraService && (
        <Dialog open={isAddExtraServiceDialogOpen} onOpenChange={setIsAddExtraServiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Extra Services</DialogTitle>
              <DialogDescription>
                Select extra services to add to your cost calculation
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingAllExtraServices ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading extra services...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Input
                  placeholder="Search extra services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <div className="grid gap-4 max-h-[calc(96vh-200px)] overflow-y-auto">
                  {filteredExtraServices && filteredExtraServices.length > 0 ? (
                    filteredExtraServices.map((extraService) => (
                      <div 
                        key={extraService.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{extraService.serviceName}</div>
                          {extraService.from_place && extraService.to_place && (
                            <div className="text-sm text-muted-foreground">{extraService.from_place} to {extraService.to_place}</div>
                          )}
                          <div className="text-sm text-muted-foreground">Rate: {formatCurrency(parseFloat(extraService.rate))}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                            {extraService.per_person && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Per Person</span>}
                            {extraService.per_day && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Per Day</span>}
                            {extraService.one_time && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">One Time</span>}
                            {!extraService.per_person && !extraService.per_day && !extraService.one_time && (
                              <span className="text-muted-foreground italic">Standard</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const newSelected = new Set(selectedExtraServices);
                            if (selectedExtraServices.has(extraService.id)) {
                              newSelected.delete(extraService.id);
                            } else {
                              newSelected.add(extraService.id);
                            }
                            setSelectedExtraServices(newSelected);
                          }}
                          variant="outline"
                          className={selectedExtraServices.has(extraService.id) ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
                        >
                          {selectedExtraServices.has(extraService.id) ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No extra services found</p>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                onClick={() => setIsAddExtraServiceDialogOpen(false)}
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Add all selected extra services
                  if (allExtraServices && selectedExtraServices.size > 0) {
                    const extraServicesToAdd = allExtraServices.filter((extraService: any) => selectedExtraServices.has(extraService.id));
                    extraServicesToAdd.forEach(extraService => {
                      onAddExtraService(extraService);
                    });
                  }
                  setIsAddExtraServiceDialogOpen(false);
                  // Clear selected extra services
                  setSelectedExtraServices(new Set());
                }}
                variant="default"
                disabled={selectedExtraServices.size === 0}
              >
                Add Selected ({selectedExtraServices.size})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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