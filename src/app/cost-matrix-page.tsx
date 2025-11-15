"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, FileDown, PlusSquare, Mountain, Edit, Copy, Check, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


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
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "@/components/ui/stepper";
import { DatePicker } from "@/components/ui/date-picker";
import type { Trek, Service } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/ui/sidebar";
import { CostTable } from "@/components/cost-table";
import { DashboardHeader } from "@/components/dashboard-header";


export interface CostRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
}

export interface SectionState {
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

const permitSchema = z.object({
  name: z.string().min(1, "Permit name is required"),
  rate: z.number().min(0, "Rate must be a positive number"),
});

const addTrekFormSchema = z.object({
  name: z.string().min(1, "Trek name is required"),
  description: z.string().min(1, "Description is required"),
  permits: z.array(permitSchema).min(1, "At least one permit is required"),
});

type AddTrekFormData = z.infer<typeof addTrekFormSchema>;


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

  const [treks, setTreks] = useState<Trek[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  const [permitsState, setPermitsState] = useState<SectionState>({id: 'permits', name: 'Permits', rows: [], discount: 0});
  const [servicesState, setServicesState] = useState<SectionState>({id: 'services', name: 'Services', rows: [], discount: 0});
  const [extraDetailsState, setExtraDetailsState] = useState<SectionState>({id: 'extraDetails', name: 'Extra Details', rows: [], discount: 0});
  const [customSections, setCustomSections] = useState<SectionState[]>([]);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionState | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  
  const [savedReportUrl, setSavedReportUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const addTrekForm = useForm<AddTrekFormData>({
    resolver: zodResolver(addTrekFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permits: [{ name: "", rate: 0 }],
    },
  });

  const { fields: permitFields, append: appendPermit, remove: removePermit } = useFieldArray({
    control: addTrekForm.control,
    name: "permits",
  });

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [treksRes, servicesRes] = await Promise.all([
            fetch('/api/treks'),
            fetch('/api/services')
        ]);
        if (!treksRes.ok || !servicesRes.ok) {
            throw new Error('Failed to fetch data');
        }
        const treksData = await treksRes.json();
        const servicesData = await servicesRes.json();
        setTreks(treksData.treks);
        setServices(servicesData.services);
        if (treksData.treks.length > 0) {
          setSelectedTrekId(treksData.treks[0].id)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "Could not load treks and services.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);


  const selectedTrek = useMemo(
    () => treks.find((trek) => trek.id === selectedTrekId),
    [selectedTrekId, treks]
  );

  useEffect(() => {
    if (selectedTrek && services.length > 0) {
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
  }, [selectedTrek, groupSize, services]);


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

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    const newTrekData = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      ...data,
    };
    try {
      const response = await fetch('/api/treks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrekData),
      });

      if (!response.ok) {
        throw new Error('Failed to save trek');
      }
      
      const { trek: newTrek } = await response.json();
      
      setTreks(prevTreks => [...prevTreks, newTrek]);
      
      toast({
        title: "Trek Added",
        description: `${data.name} has been added to the list.`,
      });
      
      addTrekForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the new trek. Please try again.",
      });
    }
  };


  const calculateSectionTotals = useCallback((section: SectionState) => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const total = subtotal - section.discount;
    return { subtotal, total };
  }, []);

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
  }, [permitsState, servicesState, extraDetailsState, customSections, calculateSectionTotals]);


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

  const handleSave = async () => {
    const groupId = uuidv4();
    const url = `${window.location.origin}/report/${groupId}?groupSize=${groupSize}`;
    
    const reportData = {
      groupId,
      reportUrl: url,
      trekId: selectedTrek?.id,
      trekName: selectedTrek?.name,
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
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      setSavedReportUrl(url);

      toast({
        title: "Data Saved",
        description: "Your trek costing details have been saved.",
      });

    } catch(error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the report. Please try again.",
      });
    }
  };

   const handleCopyToClipboard = () => {
    if (savedReportUrl) {
      navigator.clipboard.writeText(savedReportUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Report link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleExportPDF = useCallback(async () => {
    const doc = new jsPDF();
    const groupId = uuidv4();
    const qrCodeUrl = `${window.location.origin}/report/${groupId}?groupSize=${groupSize}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
    
    const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];

    const sectionsToExport = allSections.map(section => ({
        ...section,
        rows: section.rows.filter(row => row.total !== 0)
    })).filter(section => {
        return section.rows.length > 0;
    });


    let yPos = 0;
    const pageTopMargin = 15;
    const pageLeftMargin = 14;
    const pageRightMargin = 14;

    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            const footerText = `Prepared by Shalom Treks | © ${new Date().getFullYear()}`;
            doc.text(footerText, pageLeftMargin, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 35, pageHeight - 10);
        }
    };
    
    const qrCodeSize = 40;
    const qrCodeX = doc.internal.pageSize.width - qrCodeSize - pageRightMargin;
    
    doc.setFontSize(22);
    doc.text("Cost Calculation Report", pageLeftMargin, pageTopMargin + 7);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Group ID: ${groupId}`, pageLeftMargin, pageTopMargin + 15);
    
    doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, pageTopMargin, qrCodeSize, qrCodeSize);

    yPos = Math.max(pageTopMargin + 25, pageTopMargin + qrCodeSize) + 10;
    

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Group Details", pageLeftMargin, yPos);
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


    sectionsToExport.forEach(section => {
      if (yPos > 250) {
        doc.addPage();
        yPos = pageTopMargin;
      }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(section.name, pageLeftMargin, yPos);
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

    const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);

    if (sectionsToExport.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = pageTopMargin;
      }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", pageLeftMargin, yPos);
      yPos += 10;

      const summaryData = sectionsToExport.map(section => {
        const { total } = calculateSectionTotals(section);
        return [`${section.name} Total`, formatCurrency(total)];
      });
      summaryData.push(['Grand Total', formatCurrency(grandTotal)]);
      
      doc.autoTable({
          startY: yPos,
          body: summaryData,
          theme: 'plain'
      });
    }

    addFooter();

    doc.save(`cost-report-${groupId.substring(0,8)}.pdf`);
    toast({ title: "Success", description: "PDF has been exported." });

  }, [
    selectedTrek, groupSize, startDate, permitsState, servicesState, extraDetailsState, customSections, toast, calculateSectionTotals
  ]);
  
  const handleExportExcel = useCallback(() => {
     const wb = XLSX.utils.book_new();
     
     const allSections = [permitsState, servicesState, ...customSections, extraDetailsState];
     const sectionsToExport = allSections.map(section => ({
        ...section,
        rows: section.rows.filter(row => row.total !== 0)
     })).filter(section => {
       return section.rows.length > 0;
     });


     sectionsToExport.forEach(section => {
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
     
    const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);
     
    if (sectionsToExport.length > 0) {
      const summaryWsData = sectionsToExport.map(section => {
        const { total } = calculateSectionTotals(section);
        return { Item: `${section.name} Total`, Amount: total };
      });
      summaryWsData.push({ Item: 'Grand Total', Amount: grandTotal });

      const summaryWs = XLSX.utils.json_to_sheet(summaryWsData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    }

     XLSX.writeFile(wb, `cost-report-${uuidv4().substring(0,8)}.xlsx`);
     toast({ title: "Success", description: "Excel file has been exported." });
  }, [
    permitsState, servicesState, extraDetailsState, customSections, toast, calculateSectionTotals
  ]);

  if (!isClient) {
    return null;
  }
  
  const renderStepContent = () => {
    const step = steps[currentStep];

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
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
       return <CostTable 
                title="Permits & Food Details" 
                section={permitsState}
                onRowChange={handleRowChange}
                onDiscountChange={handleDiscountChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
              />;
    }
    
    if (step.name === "Services") {
        return <CostTable 
                title="Services"
                section={servicesState}
                onRowChange={handleRowChange}
                onDiscountChange={handleDiscountChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
               />;
    }

    if (step.id.startsWith('custom_step_')) {
        const customSection = customSections.find(cs => `custom_step_${cs.id}` === step.id);
        if (customSection) {
            return <CostTable 
                title={customSection.name}
                section={customSection}
                isCustom
                isDescriptionEditable
                onRowChange={handleRowChange}
                onDiscountChange={handleDiscountChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onEditSection={handleOpenEditSectionModal}
                onRemoveSection={removeSection}
            />;
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
               <CostTable 
                title="Extra Details"
                section={extraDetailsState}
                isCustom
                isDescriptionEditable
                onRowChange={handleRowChange}
                onDiscountChange={handleDiscountChange}
                onAddRow={addRow}
                onRemoveRow={removeRow}
                onEditSection={handleOpenEditSectionModal}
                onRemoveSection={removeSection}
               />
               <Separator />
               <div className="flex justify-between items-center text-xl font-bold text-primary p-4 bg-primary/5 rounded-lg">
                  <span>Final Cost:</span> 
                  <span>{formatCurrency(totalCost)}</span>
               </div>
            </CardContent>
            <CardFooter className="flex-wrap justify-end gap-2">
               <Button onClick={handleExportPDF}><FileDown /> Export PDF</Button>
               <Button onClick={handleExportExcel}><FileDown /> Export Excel</Button>
            </CardFooter>
          </Card>
      );
    }

    return null;
  };

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <DashboardHeader onAddTrekSubmit={handleAddTrekSubmit} />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              <div className="flex items-center">
                  <h1 className="text-lg font-semibold md:text-2xl">Trek Cost Calculator</h1>
              </div>
              <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 md:p-0">
                  <div className="w-full">
                      <div className="mb-8 md:mb-12">
                        <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap">
                          <div className="flex-grow md:flex-grow-0 overflow-x-auto pb-4 hide-scrollbar">
                            <Stepper
                              steps={steps.map((s, index) => ({id: s.id, name: s.name, isCustom: s.id.startsWith('custom_step_')}))}
                              currentStep={currentStep}
                              setCurrentStep={setCurrentStep}
                            />
                          </div>
                          <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-dashed shrink-0" onClick={handleOpenAddSectionModal}>
                                    <PlusSquare /> Add Section
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
                      </div>
                      
                      <div className="p-0 sm:p-6 md:p-8 md:pt-0 rounded-lg">
                        {renderStepContent()}
                      </div>

                      <div className="mt-8 flex justify-between items-center px-0 sm:px-6 md:px-8">
                        <Button onClick={prevStep} variant="outline" disabled={currentStep === 0}>
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                          {savedReportUrl && (
                            <div className="flex items-center gap-1 rounded-md bg-muted p-2 text-sm">
                                <Link href={savedReportUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-[120px] sm:max-w-xs" title={savedReportUrl}>
                                  {savedReportUrl}
                                </Link>
                                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCopyToClipboard}>
                                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                          )}
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
                  </div>
              </div>
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
