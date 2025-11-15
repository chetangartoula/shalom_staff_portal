
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, FileDown, PlusSquare, Mountain, Edit } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

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
import { Separator } from "@/components/ui/separator";


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
  { id: "02", name: "Group Details" },
  { id: "03", name: "Permits & Food" },
  { id: "04", name: "Services" },
  { id: "05", name: "Final" },
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
      setPermitsState(prev => ({...prev, name: "Permits & Food", rows: initialPermits}));

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
        { id: uuidv4(), description: 'Adv less', rate: 0, no: 1, times: 0, total: 0 }
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
        const stepId = `custom_step_${editingSection.id}`;
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, name: newSectionName } : s));
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

  const handleSave = () => {
    const allData = {
      trek: selectedTrek,
      groupSize,
      startDate,
      permits: permitsState,
      services: servicesState,
      extraDetails: extraDetailsState,
      customSections,
      totals: {
        permitsTotal: permitsTotals.total,
        servicesTotal: servicesTotals.total,
        extraDetailsTotal: extraDetailsTotals.total,
        customSectionsTotals: customSectionsTotals.map(s => ({name: s.name, total: s.total})),
        grandTotal: totalCost
      }
    };
    
    console.log("Saving data (mock API call):", JSON.stringify(allData, null, 2));

    toast({
      title: "Data Saved",
      description: "Your trek costing details have been saved (mock).",
    });
  };
  
  const handleExportPDF = useCallback(async () => {
    const doc = new jsPDF();
    const groupId = uuidv4();
    const qrCodeDataUrl = await QRCode.toDataURL(`https://example.com/report/${groupId}`);
    
    const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];
    let yPos = 22;

    // Header
    doc.setFontSize(22);
    doc.text("Cost Calculation Report", 14, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Group ID: ${groupId}`, 14, yPos);
    doc.addImage(qrCodeDataUrl, 'PNG', 150, 15, 45, 45);
    yPos = 65; // give space for qr code

    // Group Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Group Details", 14, yPos);
    yPos += 7;
    doc.autoTable({
        startY: yPos,
        body: [
            ['Trek Name', selectedTrek?.name || 'N/A'],
            ['Group Size', groupSize.toString()],
            ['Start Date', startDate ? format(startDate, 'PPP') : 'N/A'],
        ],
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;


    allSections.forEach(section => {
      if(section.rows.length === 0 && section.discount === 0) return;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(section.name, 14, yPos);
      yPos += 10;
      
      const head = [['#', 'Description', 'Rate', 'No', 'Times', 'Total']];
      const body = section.rows.map((row, i) => [
          i + 1,
          row.description,
          formatCurrency(row.rate),
          row.no,
          row.times,
          formatCurrency(row.total)
      ]);
      const {subtotal, total} = calculateSectionTotals(section);

      body.push(['', 'Subtotal', '', '', '', formatCurrency(subtotal)]);
      if (section.discount > 0) {
        body.push(['', 'Discount', '', '', '', `- ${formatCurrency(section.discount)}`]);
      }
      body.push(['', 'Total', '', '', '', formatCurrency(total)]);

      doc.autoTable({
          startY: yPos,
          head: head,
          body: body,
          theme: 'striped',
          headStyles: { fillColor: [21, 29, 79] }, // #151D4F
          didDrawPage: (data) => {
              yPos = data.cursor?.y || yPos;
          }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    // Final Summary
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, yPos);
    yPos += 10;

    const summaryData = [
      ['Permits Total', formatCurrency(permitsTotals.total)],
      ['Services Total', formatCurrency(servicesTotals.total)],
      ...customSectionsTotals.map(s => [`${s.name} Total`, formatCurrency(s.total)]),
      ['Extra Details Total', formatCurrency(extraDetailsTotals.total)],
      ['Grand Total', formatCurrency(totalCost)]
    ];
    
    doc.autoTable({
        startY: yPos,
        body: summaryData,
        theme: 'plain'
    });

    doc.save(`cost-report-${groupId.substring(0,8)}.pdf`);
    toast({ title: "Success", description: "PDF has been exported." });

  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast, permitsTotals, servicesTotals, customSectionsTotals, extraDetailsTotals, totalCost
  ]);
  
  const handleExportExcel = useCallback(() => {
     const wb = XLSX.utils.book_new();
     
     const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];

     allSections.forEach(section => {
       if (section.rows.length === 0 && section.discount === 0) return;
       const {subtotal, total} = calculateSectionTotals(section);
       const wsData = section.rows.map(row => ({
         Description: row.description,
         Rate: row.rate,
         No: row.no,
         Times: row.times,
         Total: row.total,
       }));
       wsData.push({Description: 'Subtotal', Rate: '', No: '', Times: '', Total: subtotal});
       if(section.discount > 0) {
         wsData.push({Description: 'Discount', Rate: '', No: '', Times: '', Total: -section.discount});
       }
       wsData.push({Description: 'Total', Rate: '', No: '', Times: '', Total: total});
       const ws = XLSX.utils.json_to_sheet(wsData);
       XLSX.utils.book_append_sheet(wb, ws, section.name.substring(0, 31));
     });
     
     const summaryWsData = [
        { Item: 'Permits Total', Amount: permitsTotals.total },
        { Item: 'Services Total', Amount: servicesTotals.total },
        ...customSectionsTotals.map(s => ({ Item: `${s.name} Total`, Amount: s.total })),
        { Item: 'Extra Details Total', Amount: extraDetailsTotals.total },
        { Item: 'Grand Total', Amount: totalCost },
     ];
     const summaryWs = XLSX.utils.json_to_sheet(summaryWsData);
     XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

     XLSX.writeFile(wb, `cost-report-${uuidv4().substring(0,8)}.xlsx`);
     toast({ title: "Success", description: "Excel file has been exported." });
  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast, permitsTotals, servicesTotals, customSectionsTotals, extraDetailsTotals, totalCost
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
          <div className="mt-6 flex flex-col md:flex-row items-start justify-between gap-6">
            <Button onClick={() => addRow(sectionId)} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <div className="w-full md:w-auto md:min-w-64 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor={`discount-${sectionId}`} className="shrink-0">Discount</Label>
                  <Input 
                    type="number" 
                    id={`discount-${sectionId}`} 
                    value={section.discount} 
                    onChange={e => handleDiscountChange(sectionId, Number(e.target.value))} 
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
  };
  
  const renderStepContent = () => {
    const step = steps[currentStep];
    
    if (currentStep === 0) {
      return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Choose Your Adventure</h2>
            <p className="mt-2 text-muted-foreground">Select a trek to begin calculating your costs.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {treks.map((trek) => (
                <Card 
                  key={trek.id} 
                  className={cn(
                    "cursor-pointer text-left hover:shadow-lg transition-all duration-300",
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

    if (step.name === "Group Details") {
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
          </div>
        );
    }
    
    if (step.name === "Permits & Food") {
       return renderCostTable("Permits & Food Details", "permits");
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
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold text-muted-foreground">PERMITS TOTAL</h3>
                    <p className="text-2xl font-bold">{formatCurrency(permitsTotals.total)}</p>
                  </div>
                   <div>
                    <h3 className="font-semibold text-muted-foreground">SERVICES TOTAL</h3>
                    <p className="text-2xl font-bold">{formatCurrency(servicesTotals.total)}</p>
                  </div>
                  {customSectionsTotals.map(sec => (
                     <div key={sec.id}>
                        <h3 className="font-semibold text-muted-foreground uppercase">{sec.name} TOTAL</h3>
                        <p className="text-2xl font-bold">{formatCurrency(sec.total)}</p>
                    </div>
                  ))}
                </div>
              <Separator />
               {renderCostTable("Extra Details", "extraDetails")}
               <Separator />
               <div className="flex justify-between items-center text-xl font-bold text-primary p-4 bg-primary/5 rounded-lg">
                  <span>Final Cost:</span> 
                  <span>{formatCurrency(totalCost)}</span>
               </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
               <Button onClick={handleExportPDF}><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
               <Button onClick={handleExportExcel}><FileDown className="mr-2 h-4 w-4" /> Export Excel</Button>
            </CardFooter>
          </Card>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50/50 font-body">
        <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-white">
            <h1 className="text-xl font-bold text-primary">CostMaster</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 mb-8 md:mb-12">
                  <div className="w-full sm:w-auto overflow-x-auto pb-4">
                    <Stepper
                      steps={steps.map((s, index) => ({id: s.id, name: s.name, isCustom: s.id.startsWith('custom_step_')}))}
                      currentStep={currentStep}
                      setCurrentStep={setCurrentStep}
                    />
                  </div>
                  <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline" className="border-dashed shrink-0" onClick={handleOpenAddSectionModal}>
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
                
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-sm">
                  {renderStepContent()}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button onClick={prevStep} variant="outline" disabled={currentStep === 0}>
                     Previous
                  </Button>
                  {currentStep === steps.length - 1 ? (
                     <Button onClick={handleSave}>
                        Save
                     </Button>
                  ) : (
                     <Button onClick={nextStep}>
                        Next
                     </Button>
                  )}
                </div>
            </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}

    
