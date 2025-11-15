"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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

interface CostRow {
  id: number;
  description: string;
  rate: string;
  times: string;
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export default function CostMatrixPage() {
  const [rows, setRows] = useState<CostRow[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const savedRows = localStorage.getItem("costMatrixRows");
      const savedDiscount = localStorage.getItem("costMatrixDiscount");
      if (savedRows && JSON.parse(savedRows).length > 0) {
        setRows(JSON.parse(savedRows));
      } else {
        setRows([{ id: Date.now(), description: "Initial Item", rate: "100", times: "2" }]);
      }
      if (savedDiscount) {
        setDiscount(savedDiscount);
      }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
        setRows([{ id: Date.now(), description: "Initial Item", rate: "100", times: "2" }]);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("costMatrixRows", JSON.stringify(rows));
      localStorage.setItem("costMatrixDiscount", discount);
    }
  }, [rows, discount, isClient]);

  const { subtotal, netTotal, processedRows } = useMemo(() => {
    let currentSubtotal = 0;
    const processed = rows.map((row) => {
      const rateNum = parseFloat(row.rate) || 0;
      const timesNum = parseFloat(row.times) || 0;
      const total = rateNum * timesNum;
      currentSubtotal += total;
      return { ...row, total };
    });
    const discountNum = parseFloat(discount) || 0;
    const currentNetTotal = currentSubtotal - discountNum;
    return {
      subtotal: currentSubtotal,
      netTotal: currentNetTotal,
      processedRows: processed,
    };
  }, [rows, discount]);

  const handleAddRow = useCallback(() => {
    setRows((prevRows) => [
      ...prevRows,
      { id: Date.now(), description: "", rate: "0", times: "1" },
    ]);
  }, []);

  const handleDeleteRow = useCallback((id: number) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  }, []);

  const handleRowChange = useCallback((id: number, field: keyof CostRow, value: string) => {
      setRows((prevRows) =>
        prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
      );
    }, []);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscount(e.target.value);
  };
  
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      doc.text("Cost Calculation Report", 14, 22);
      
      const tableColumn = ["#", "Description", "Rate", "Times", "Total"];
      const tableRows: (string | number)[][] = [];

      processedRows.forEach((row, index) => {
        const rowData = [
          index + 1,
          row.description,
          formatCurrency(parseFloat(row.rate) || 0),
          row.times,
          formatCurrency(row.total),
        ];
        tableRows.push(rowData);
      });

      doc.autoTable({
        startY: 30,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [60, 179, 113] },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      
      doc.setFontSize(12);
      doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 14, finalY + 15);
      doc.text(`Discount: ${formatCurrency(parseFloat(discount) || 0)}`, 14, finalY + 22);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Total: ${formatCurrency(netTotal)}`, 14, finalY + 32);

      doc.save("cost_matrix_report.pdf");
      toast({ title: "Success", description: "PDF report has been downloaded." });
    } catch(error) {
      console.error("Failed to generate PDF:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  }, [processedRows, subtotal, discount, netTotal, toast]);
  
  const handleExportExcel = useCallback(() => {
    try {
      const worksheetData = processedRows.map((row, index) => ({
        'Serial No': index + 1,
        'Description': row.description,
        'Rate': parseFloat(row.rate) || 0,
        'Times': parseFloat(row.times) || 0,
        'Total': row.total,
      }));

      worksheetData.push({ 'Description': '' } as any); // Spacer
      worksheetData.push({ 'Description': 'Subtotal', 'Total': subtotal } as any);
      worksheetData.push({ 'Description': 'Discount', 'Total': parseFloat(discount) || 0 } as any);
      worksheetData.push({ 'Description': 'Net Total', 'Total': netTotal } as any);

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CostMatrix");
      
      worksheet["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
      
      XLSX.writeFile(workbook, "cost_matrix_report.xlsx");
      toast({ title: "Success", description: "Excel report has been downloaded." });
    } catch(error) {
      console.error("Failed to generate Excel:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Excel." });
    }
  }, [processedRows, subtotal, discount, netTotal, toast]);

  if (!isClient) {
    return null;
  }

  return (
    <>
    <main className="container mx-auto p-4 md:p-8 font-body">
      <Card className="mb-8 shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-3xl font-headline text-primary">CostMatrix</CardTitle>
            <CardDescription>Create, edit, and export your cost calculations.</CardDescription>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button onClick={handleExportPDF}><FileDown className="mr-2" /> Export PDF</Button>
            <Button onClick={handleExportExcel}><FileDown className="mr-2" /> Export Excel</Button>
          </div>
        </CardHeader>
      </Card>
      
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S/N</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-40">Rate</TableHead>
                  <TableHead className="w-32">Times</TableHead>
                  <TableHead className="w-40 text-right">Total</TableHead>
                  <TableHead className="w-20 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRows.map((row, index) => (
                  <TableRow key={row.id} className="transition-colors hover:bg-accent/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => handleRowChange(row.id, "description", e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-1"
                        placeholder="Item description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.rate}
                        onChange={(e) => handleRowChange(row.id, "rate", e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-1"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.times}
                        onChange={(e) => handleRowChange(row.id, "times", e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-1"
                        placeholder="1"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(row.total)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRow(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Button onClick={handleAddRow} variant="outline"><Plus className="mr-2" /> Add Row</Button>
        </CardFooter>
      </Card>
      
      <div className="h-32"></div>

      <Card className="fixed bottom-0 left-0 right-0 w-full rounded-none rounded-t-lg border-t-2 shadow-2xl z-50 transition-transform animate-in slide-in-from-bottom-full duration-500">
        <CardContent className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4">
          <div className="text-center md:text-left">
            <Label className="text-sm font-medium text-muted-foreground">Subtotal</Label>
            <p className="text-2xl font-semibold tabular-nums tracking-tight transition-all duration-300">
              {formatCurrency(subtotal)}
            </p>
          </div>
          <div>
            <Label htmlFor="discount" className="text-sm font-medium text-muted-foreground">Discount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={handleDiscountChange}
                className="text-lg font-semibold pl-6"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="text-center md:text-right bg-primary/10 p-4 rounded-lg">
            <Label className="text-sm font-medium text-primary/80">Net Total</Label>
            <p className="text-3xl font-bold text-primary tabular-nums tracking-tight transition-all duration-300">
              {formatCurrency(netTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
    <Toaster />
    </>
  );
}
