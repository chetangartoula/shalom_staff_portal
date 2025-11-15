
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, FileDown, ArrowLeft, ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { treks, services, Trek } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

interface CostRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
}

interface ExtraDetailsRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const steps = [
  { id: "01", name: "Trek Details", href: "#" },
  { id: "02", name: "Permits & Services", href: "#" },
  { id: "03", name: "Cost Summary", href: "#" },
];

export default function TrekCostingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Step 1 State
  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  // Step 2 State
  const [permitRows, setPermitRows] = useState<CostRow[]>([]);
  const [serviceRows, setServiceRows] = useState<CostRow[]>([]);
  const [extraDetailsRows, setExtraDetailsRows] = useState<ExtraDetailsRow[]>([]);

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
      setPermitRows(initialPermits);

      const initialServices = services.map((service) => ({
        id: uuidv4(),
        description: service.name,
        rate: service.rate,
        no: 0, // Initially not selected
        times: service.times,
        total: 0,
      }));
      setServiceRows(initialServices);

       const initialExtraDetails = [
        { id: uuidv4(), description: 'Satellite device', rate: 0, no: 1, times: 12, total: 0 },
        { id: uuidv4(), description: 'Adv less', rate: 0, no: 1, times: 1, total: 0 }
      ];
      setExtraDetailsRows(initialExtraDetails);
    }
  }, [selectedTrek, groupSize]);


  const handleRowChange = (
    id: string,
    field: keyof CostRow,
    value: any,
    section: "permits" | "services" | "extraDetails"
  ) => {
    const updater = (prevRows: CostRow[] | ExtraDetailsRow[]) => {
      return prevRows.map((row) => {
        if (row.id === id) {
          const newRow = { ...row, [field]: value };
          if(field === 'no' || field === 'rate' || field === 'times') {
            newRow.total = (newRow.rate || 0) * (newRow.no || 0) * (newRow.times || 0);
          }
          return newRow;
        }
        return row;
      });
    };
    if (section === "permits") {
      setPermitRows(updater as any);
    } else if (section === "services") {
      setServiceRows(updater as any);
    } else {
      setExtraDetailsRows(updater as any);
    }
  };


  const {
    permitsSubtotal,
    servicesSubtotal,
    extraDetailsSubtotal,
    groupTotalWithoutService,
    groupTotalWithService,
    totalCostPerEachWoService,
    totalCostPerEachWithService,
    finalCostWoService
  } = useMemo(() => {
    const permitsSubtotal = permitRows.reduce((acc, row) => acc + row.total, 0);
    const servicesSubtotal = serviceRows.reduce((acc, row) => acc + row.total, 0);
    const extraDetailsSubtotal = extraDetailsRows.reduce((acc, row) => acc + row.total, 0);

    const groupTotalWithoutService = permitsSubtotal;
    const groupTotalWithService = permitsSubtotal + servicesSubtotal;
    const serviceCharge = groupTotalWithService * 0.10;
    const totalWithServiceCharge = groupTotalWithService + serviceCharge;

    const totalCostPerEachWoService = groupSize > 0 ? groupTotalWithoutService / groupSize : 0;
    const totalCostPerEachWithService = groupSize > 0 ? totalWithServiceCharge / groupSize : 0;
    
    const finalCostWoService = groupTotalWithoutService + extraDetailsSubtotal;

    return {
      permitsSubtotal,
      servicesSubtotal,
      extraDetailsSubtotal,
      groupTotalWithoutService,
      groupTotalWithService: totalWithServiceCharge,
      totalCostPerEachWoService,
      totalCostPerEachWithService,
      finalCostWoService
    };
  }, [permitRows, serviceRows, extraDetailsRows, groupSize]);


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
    try {
      const doc = new jsPDF();
      const uniqueGroupId = uuidv4();
      const qrCodeDataUrl = await QRCode.toDataURL(
        `example.com/report/${btoa(uniqueGroupId)}`
      );

      doc.setFontSize(20);
      doc.text("Trek Costing Report", 14, 22);
      doc.setFontSize(12);
      doc.text(`Trek: ${selectedTrek?.name || "N/A"}`, 14, 32);
      doc.text(`Group Size: ${groupSize}`, 14, 39);
      doc.text(`Start Date: ${startDate?.toLocaleDateString() || "N/A"}`, 14, 46);
      
      doc.addImage(qrCodeDataUrl, "PNG", 150, 15, 40, 40);

      let yPos = 60;

      if (permitRows.length > 0) {
        doc.setFontSize(14);
        doc.text("Permits", 14, yPos);
        yPos += 7;
        doc.autoTable({
          startY: yPos,
          head: [["Description", "Rate", "No.", "Times", "Total"]],
          body: permitRows.map((row) => [
            row.description,
            formatCurrency(row.rate),
            row.no,
            row.times,
            formatCurrency(row.total),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [60, 179, 113] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Permits Subtotal: ${formatCurrency(permitsSubtotal)}`, 14, yPos);
        yPos += 10;
      }

      if (serviceRows.filter(r => r.no > 0).length > 0) {
        doc.setFontSize(14);
        doc.text("Services", 14, yPos);
        yPos += 7;
        doc.autoTable({
          startY: yPos,
          head: [["Description", "Rate", "No.", "Times", "Total"]],
          body: serviceRows.filter(r => r.no > 0).map((row) => [
            row.description,
            formatCurrency(row.rate),
            row.no,
            row.times,
            formatCurrency(row.total),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [60, 179, 113] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Services Subtotal: ${formatCurrency(servicesSubtotal)}`, 14, yPos);
        yPos += 10;
      }
      
      if (extraDetailsRows.filter(r => r.rate > 0).length > 0) {
        doc.setFontSize(14);
        doc.text("Extra Details", 14, yPos);
        yPos += 7;
        doc.autoTable({
          startY: yPos,
          head: [["Description", "Rate", "No.", "Times", "Total"]],
          body: extraDetailsRows.filter(r => r.rate > 0).map((row) => [
            row.description,
            formatCurrency(row.rate),
            row.no,
            row.times,
            formatCurrency(row.total),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [60, 179, 113] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Extra Details Subtotal: ${formatCurrency(extraDetailsSubtotal)}`, 14, yPos);
        yPos += 10;
      }


      doc.setFontSize(12);
      doc.text(`Group Total without service: ${formatCurrency(groupTotalWithoutService)}`, 14, yPos);
      yPos += 7;
      doc.text(`Group Total with service (incl. 10% charge): ${formatCurrency(groupTotalWithService)}`, 14, yPos);
      yPos += 7;
      doc.text(`Total cost for each w/o service: ${formatCurrency(totalCostPerEachWoService)}`, 14, yPos);
      yPos += 7;
      doc.text(`Total cost for each with service: ${formatCurrency(totalCostPerEachWithService)}`, 14, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Final Cost (w/o service): ${formatCurrency(finalCostWoService)}`, 14, yPos);

      doc.save("trek_costing_report.pdf");
      toast({ title: "Success", description: "PDF report has been downloaded." });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  }, [
    selectedTrek, groupSize, startDate, permitRows, serviceRows, extraDetailsRows,
    permitsSubtotal, servicesSubtotal, extraDetailsSubtotal, groupTotalWithoutService, 
    groupTotalWithService, totalCostPerEachWoService, totalCostPerEachWithService, 
    finalCostWoService, toast
  ]);
  
  const handleExportExcel = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();

      const detailsData = [
        { Field: "Trek", Value: selectedTrek?.name || "N/A" },
        { Field: "Group Size", Value: groupSize },
        { Field: "Start Date", Value: startDate?.toLocaleDateString() || "N/A" },
      ];
      const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
      XLSX.utils.book_append_sheet(workbook, detailsSheet, "Trek Details");

      if (permitRows.length > 0) {
        const permitData = permitRows.map(row => ({
          Description: row.description,
          Rate: row.rate,
          'No.': row.no,
          Times: row.times,
          Total: row.total,
        }));
        const permitSheet = XLSX.utils.json_to_sheet(permitData);
        XLSX.utils.book_append_sheet(workbook, permitSheet, "Permits");
      }
      
      const activeServices = serviceRows.filter(r => r.no > 0);
      if (activeServices.length > 0) {
        const serviceData = activeServices.map(row => ({
          Description: row.description,
          Rate: row.rate,
          'No.': row.no,
          Times: row.times,
          Total: row.total,
        }));
        const serviceSheet = XLSX.utils.json_to_sheet(serviceData);
        XLSX.utils.book_append_sheet(workbook, serviceSheet, "Services");
      }

      const activeExtraDetails = extraDetailsRows.filter(r => r.rate > 0);
      if (activeExtraDetails.length > 0) {
        const extraDetailsData = activeExtraDetails.map(row => ({
          Description: row.description,
          Rate: row.rate,
          'No.': row.no,
          Times: row.times,
          Total: row.total,
        }));
        const extraDetailsSheet = XLSX.utils.json_to_sheet(extraDetailsData);
        XLSX.utils.book_append_sheet(workbook, extraDetailsSheet, "Extra Details");
      }

      const summaryData = [
        { Description: "Permits Subtotal", Total: permitsSubtotal },
        { Description: "Services Subtotal", Total: servicesSubtotal },
        { Description: "Extra Details Subtotal", Total: extraDetailsSubtotal },
        { Description: "Group Total without service", Total: groupTotalWithoutService },
        { Description: "Group Total with service (incl. 10% charge)", Total: groupTotalWithService },
        { Description: "Total cost for each w/o service", Total: totalCostPerEachWoService },
        { Description: "Total cost for each with service", Total: totalCostPerEachWithService },
        { Description: "Final Cost (w/o service)", Total: finalCostWoService },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData, {
        header: ["Description", "Total"]
      });
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Cost Summary");


      XLSX.writeFile(workbook, "trek_costing_report.xlsx");
      toast({ title: "Success", description: "Excel report has been downloaded." });
    } catch (error) {
      console.error("Failed to generate Excel:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Excel." });
    }
  }, [
    selectedTrek, groupSize, startDate, permitRows, serviceRows, extraDetailsRows,
    permitsSubtotal, servicesSubtotal, extraDetailsSubtotal, groupTotalWithoutService, 
    groupTotalWithService, totalCostPerEachWoService, totalCostPerEachWithService, 
    finalCostWoService, toast
  ]);


  if (!isClient) {
    return null;
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Trek Details</CardTitle>
              <CardDescription>
                Select your trek, group size, and start date.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="trek-select">Choose Trek</Label>
                <Select onValueChange={setSelectedTrekId} value={selectedTrekId || ''}>
                  <SelectTrigger id="trek-select">
                    <SelectValue placeholder="Select a trek" />
                  </SelectTrigger>
                  <SelectContent>
                    {treks.map((trek) => (
                      <SelectItem key={trek.id} value={trek.id}>
                        {trek.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group-size">Group Size</Label>
                <Input
                  id="group-size"
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Permits</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>No.</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permitRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>{formatCurrency(row.rate)}</TableCell>
                        <TableCell>
                          <Input type="number" value={row.no} onChange={e => handleRowChange(row.id, 'no', Number(e.target.value), 'permits')} className="w-20"/>
                        </TableCell>
                         <TableCell>
                          <Input type="number" value={row.times} onChange={e => handleRowChange(row.id, 'times', Number(e.target.value), 'permits')} className="w-20"/>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Select the services you need.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>No.</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>{formatCurrency(row.rate)}</TableCell>
                        <TableCell>
                          <Input type="number" value={row.no} onChange={e => handleRowChange(row.id, 'no', Number(e.target.value), 'services')} className="w-20"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.times} onChange={e => handleRowChange(row.id, 'times', Number(e.target.value), 'services')} className="w-20"/>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Extra Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>No.</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extraDetailsRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                           <Input type="number" value={row.rate} onChange={e => handleRowChange(row.id, 'rate', Number(e.target.value), 'extraDetails')} className="w-24"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.no} onChange={e => handleRowChange(row.id, 'no', Number(e.target.value), 'extraDetails')} className="w-20"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.times} onChange={e => handleRowChange(row.id, 'times', Number(e.target.value), 'extraDetails')} className="w-20"/>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
              <CardDescription>Review your trek costs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between"><span>Permits Subtotal:</span> <span>{formatCurrency(permitsSubtotal)}</span></div>
               <div className="flex justify-between"><span>Services Subtotal:</span> <span>{formatCurrency(servicesSubtotal)}</span></div>
               <div className="flex justify-between"><span>Extra Details Subtotal:</span> <span>{formatCurrency(extraDetailsSubtotal)}</span></div>
               <hr />
               <div className="flex justify-between font-bold"><span>Group Total without service:</span> <span>{formatCurrency(groupTotalWithoutService)}</span></div>
                <div className="flex justify-between font-bold"><span>Group Total with service (incl. 10% charge):</span> <span>{formatCurrency(groupTotalWithService)}</span></div>
               <div className="flex justify-between"><span>Total cost for each w/o service:</span> <span>{formatCurrency(totalCostPerEachWoService)}</span></div>
                <div className="flex justify-between"><span>Total cost for each with service:</span> <span>{formatCurrency(totalCostPerEachWithService)}</span></div>
               <hr />
               <div className="flex justify-between text-xl font-bold text-primary"><span>Final Cost (w/o service):</span> <span>{formatCurrency(finalCostWoService)}</span></div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
               <Button onClick={handleExportPDF}><FileDown className="mr-2" /> Export PDF</Button>
               <Button onClick={handleExportExcel}><FileDown className="mr-2" /> Export Excel</Button>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <main className="container mx-auto p-4 md:p-8 font-body">
        <div className="mb-8">
          <Stepper
            currentStep={currentStep}
            steps={steps}
            setCurrentStep={setCurrentStep}
          />
        </div>

        <div className="mt-8">{renderStepContent()}</div>

        <div className="mt-8 flex justify-between">
          <Button onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="mr-2" /> Previous
          </Button>
          <Button onClick={nextStep} disabled={currentStep === steps.length - 1}>
            Next <ArrowRight className="ml-2" />
          </Button>
        </div>
      </main>
      <Toaster />
    </>
  );
}
