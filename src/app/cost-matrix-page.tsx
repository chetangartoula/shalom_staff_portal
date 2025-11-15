
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, FileDown, ArrowLeft, ArrowRight, Save, Upload, Download, Moon, PlusSquare, Mountain, X, Edit } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "@/components/ui/stepper";
import { DatePicker } from "@/components/ui/date-picker";
import { treks, services, Trek } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";


interface CostRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
}

interface SectionState {
    id: string;
    name: string;
    rows: CostRow[];
    discount: number;
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const initialSteps = [
  { id: "01", name: "Select Trek" },
  { id: "02", name: "Permits & Food" },
  { id: "03", name: "Services" },
  { id: "04", name: "Final" },
];


export default function TrekCostingPage() {
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [selectedTrekId, setSelectedTrekId] = useState<string | null>('manaslu');
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  const [permitsState, setPermitsState] = useState<SectionState>({id: 'permits', name: 'Permits', rows: [], discount: 0});
  const [servicesState, setServicesState] = useState<SectionState>({id: 'services', name: 'Services', rows: [], discount: 0});
  const [extraDetailsState, setExtraDetailsState] = useState<SectionState>({id: 'extraDetails', name: 'Extra Details', rows: [], discount: 0});
  const [customSections, setCustomSections] = useState<SectionState[]>([]);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionState | null>(null);
  const [newSectionName, setNewSectionName] = useState("");


  const selectedTrek = useMemo(
    () => treks.find((trek) => trek.id === selectedTrekId),
    [selectedTrekId]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedTrek) {
      const initialPermits = selectedTrek.permits.map((permit) => ({
        id: uuidv4(),
        description: permit.name,
        rate: permit.rate,
        no: groupSize,
        times: 1,
        total: permit.rate * groupSize,
      }));
      setPermitsState(prev => ({...prev, rows: initialPermits}));

      const initialServices = services.map((service) => ({
        id: uuidv4(),
        description: service.name,
        rate: service.rate,
        no: 0, 
        times: service.times,
        total: 0,
      }));
      setServicesState(prev => ({...prev, rows: initialServices}));

       const initialExtraDetails = [
        { id: uuidv4(), description: 'Satellite device', rate: 0, no: 1, times: 12, total: 0 },
        { id: uuidv4(), description: 'Adv less', rate: 0, no: 1, times: 1, total: 0 }
      ];
      setExtraDetailsState(prev => ({...prev, rows: initialExtraDetails}));
    }
  }, [selectedTrek, groupSize]);


  const getSectionState = (sectionId: string): SectionState | undefined => {
    if (sectionId === "permits") return permitsState;
    if (sectionId === "services") return servicesState;
    if (sectionId === "extraDetails") return extraDetailsState;
    return customSections.find(s => s.id === sectionId);
  };

  const setSectionState = (sectionId: string, newState: Partial<SectionState>) => {
    const updater = (prev: SectionState) => ({...prev, ...newState});
    if (sectionId === "permits") setPermitsState(updater);
    else if (sectionId === "services") setServicesState(updater);
    else if (sectionId === "extraDetails") setExtraDetailsState(updater);
    else {
      setCustomSections(prev => prev.map(s => s.id === sectionId ? {...s, ...newState} : s));
    }
  };

  const handleRowChange = (id: string, field: keyof CostRow, value: any, sectionId: string) => {
    const section = getSectionState(sectionId);
    if (!section) return;

    const updatedRows = section.rows.map((row) => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        if (field === 'no' || field === 'rate' || field === 'times') {
          newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
        }
        return newRow;
      }
      return row;
    });
    setSectionState(sectionId, { rows: updatedRows });
  };
  
  const handleDiscountChange = (sectionId: string, value: number) => {
    setSectionState(sectionId, { discount: value });
  };

  const addRow = (sectionId: string) => {
    const newRow: CostRow = { id: uuidv4(), description: "", rate: 0, no: 1, times: 1, total: 0 };
    const section = getSectionState(sectionId);
    if (!section) return;
    setSectionState(sectionId, { rows: [...section.rows, newRow] });
  };

  const removeRow = (id: string, sectionId: string) => {
    const section = getSectionState(sectionId);
    if (!section) return;
    setSectionState(sectionId, { rows: section.rows.filter((row) => row.id !== id) });
  };
  
  const handleOpenAddSectionModal = () => {
    setEditingSection(null);
    setNewSectionName("");
    setIsSectionModalOpen(true);
  };
  
  const handleOpenEditSectionModal = (section: SectionState) => {
    setEditingSection(section);
    setNewSectionName(section.name);
    setIsSectionModalOpen(true);
  };
  
  const handleSaveSection = () => {
    if (!newSectionName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Section name cannot be empty." });
      return;
    }

    if (editingSection) { // Editing existing custom section
        setCustomSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, name: newSectionName } : s));
        setSteps(prev => prev.map(s => s.id === `custom_step_${editingSection.id}` ? { ...s, name: newSectionName } : s));
    } else { // Adding new custom section
        const newSectionId = uuidv4();
        const newSection: SectionState = { id: newSectionId, name: newSectionName, rows: [], discount: 0 };
        setCustomSections(prev => [...prev, newSection]);

        const newStep = { id: `custom_step_${newSectionId}`, name: newSectionName };
        const finalStepIndex = steps.findIndex(s => s.name === "Final");
        const newSteps = [...steps.slice(0, finalStepIndex), newStep, steps[finalStepIndex]];
        setSteps(newSteps);
    }
    
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setNewSectionName("");
  };
  
  const removeSection = (sectionId: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    setSteps(prev => prev.filter(s => s.id !== `custom_step_${sectionId}`));
  };


  const calculateSectionTotals = (section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const total = subtotal - section.discount;
    return { subtotal, total };
  };

  const {
    permitsTotals,
    servicesTotals,
    extraDetailsTotals,
    customSectionsTotals,
    totalCost,
  } = useMemo(() => {
    const permitsTotals = calculateSectionTotals(permitsState);
    const servicesTotals = calculateSectionTotals(servicesState);
    const extraDetailsTotals = calculateSectionTotals(extraDetailsState);
    
    const customSectionsTotals = customSections.map(section => ({
        ...section,
        ...calculateSectionTotals(section),
    }));

    const totalCustomsTotal = customSectionsTotals.reduce((acc, section) => acc + section.total, 0);

    const totalCost = permitsTotals.total + servicesTotals.total + extraDetailsTotals.total + totalCustomsTotal;

    return {
      permitsTotals,
      servicesTotals,
      extraDetailsTotals,
      customSectionsTotals,
      totalCost
    };
  }, [permitsState, servicesState, extraDetailsState, customSections]);


  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && !selectedTrekId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a trek to proceed.",
        });
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleExportPDF = useCallback(async () => {
    // PDF export logic will need to be updated to include discounts
  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast
  ]);
  
  const handleExportExcel = useCallback(() => {
     // Excel export logic will need to be updated to include discounts
  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast
  ]);


  if (!isClient) {
    return null;
  }
  
  const renderCostTable = (title: string, sectionId: string, isCustom: boolean = false) => {
    const section = getSectionState(sectionId);
    if (!section) return null;
    
    const isDescriptionEditable = isCustom || sectionId === 'extraDetails';
    const { subtotal, total } = calculateSectionTotals(section);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {isCustom && (
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditSectionModal(section)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Description</TableHead>
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
                        onChange={(e) => handleRowChange(row.id, 'description', e.target.value, sectionId)}
                        className="w-full"
                      />
                    ) : (
                      row.description
                    )}
                  </TableCell>
                  <TableCell>
                     <Input type="number" value={row.rate} onChange={e => handleRowChange(row.id, 'rate', Number(e.target.value), sectionId)} className="w-24"/>
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={row.no} onChange={e => handleRowChange(row.id, 'no', Number(e.target.value), sectionId)} className="w-20"/>
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={row.times} onChange={e => handleRowChange(row.id, 'times', Number(e.target.value), sectionId)} className="w-20"/>
                  </TableCell>
                  <TableCell>{formatCurrency(row.total)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeRow(row.id, sectionId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => addRow(sectionId)}>
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <div className="flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor={`discount-${sectionId}`}>Discount</Label>
                  <Input type="number" id={`discount-${sectionId}`} value={section.discount} onChange={e => handleDiscountChange(sectionId, Number(e.target.value))} className="w-32" />
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                    <p className="font-bold">Total: {formatCurrency(total)}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderStepContent = () => {
    const step = steps[currentStep];
    
    if (currentStep === 0) {
      return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Choose Your Adventure</h2>
            <p className="mt-2 text-muted-foreground">Select a trek to begin calculating your costs.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {treks.map((trek) => (
                <Card 
                  key={trek.id} 
                  className={cn(
                    "cursor-pointer text-left hover:shadow-lg transition-shadow",
                    selectedTrekId === trek.id && "border-primary ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedTrekId(trek.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Mountain className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold">{trek.name}</h3>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{trek.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      );
    }
    
    if (step.name === "Permits & Food") {
       return (
          <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Group Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-2">
                        <Label htmlFor="group-size">Group Size</Label>
                        <Input
                          id="group-size"
                          type="number"
                          value={groupSize}
                          onChange={(e) => setGroupSize(Math.max(1, Number(e.target.value)))}
                          min="1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <DatePicker date={startDate} setDate={setStartDate} />
                      </div>
                </CardContent>
            </Card>
            {renderCostTable("Permits", "permits")}
          </div>
        );
    }
    
    if (step.name === "Services") {
        return renderCostTable("Services", "services");
    }

    if (step.id.startsWith('custom_step_')) {
        const customSection = customSections.find(cs => `custom_step_${cs.id}` === step.id);
        if (customSection) {
            return renderCostTable(customSection.name, customSection.id, true);
        }
    }
    
    if (step.name === "Final") {
      return (
          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
              <CardDescription>Review your trek costs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between"><span>Permits Total:</span> <span>{formatCurrency(permitsTotals.total)}</span></div>
               <div className="flex justify-between"><span>Services Total:</span> <span>{formatCurrency(servicesTotals.total)}</span></div>
               {customSectionsTotals.map(sec => (
                  <div key={sec.id} className="flex justify-between"><span>{sec.name} Total:</span> <span>{formatCurrency(sec.total)}</span></div>
               ))}
               <hr />
               {renderCostTable("Extra Details", "extraDetails")}
               <hr />
               <div className="flex justify-between text-xl font-bold text-primary"><span>Final Cost:</span> <span>{formatCurrency(totalCost)}</span></div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
               <Button onClick={handleExportPDF}><FileDown className="mr-2" /> Export PDF</Button>
               <Button onClick={handleExportExcel}><FileDown className="mr-2" /> Export Excel</Button>
            </CardFooter>
          </Card>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50 font-body">
        <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
            <h1 className="text-xl font-bold text-primary">CostMaster</h1>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Save className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon"><Download className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon"><Upload className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon"><Moon className="h-5 w-5"/></Button>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-center mb-12">
                  <Stepper
                    steps={steps.map(s => ({id: s.id, name: s.name}))}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                  <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline" className="ml-8 border-dashed" onClick={handleOpenAddSectionModal}>
                            <PlusSquare className="mr-2 h-4 w-4"/> Add Section
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="section-name" className="text-right">Name</Label>
                                <Input id="section-name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveSection}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  {renderStepContent()}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button onClick={prevStep} variant="outline" disabled={currentStep === 0}>
                     Previous
                  </Button>
                  <Button onClick={nextStep} disabled={currentStep === steps.length - 1}>
                    Next
                  </Button>
                </div>
            </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}
