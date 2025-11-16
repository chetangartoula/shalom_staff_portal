
"use client";

import { format } from "date-fns";
import type { Trek, SectionState } from "@/lib/types";

type ReportState = {
  groupId: string;
  trekId: string | null;
  trekName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
};

export async function handleExportPDF({
  selectedTrek,
  report,
  calculateSectionTotals,
  userName
}: {
  selectedTrek: Trek | undefined,
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number },
  userName?: string
}) {
  if (!selectedTrek) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { default: QRCode } = await import("qrcode");

  const doc = new jsPDF();
  const qrCodeUrl = `${window.location.origin}/report/${report.groupId}?groupSize=${report.groupSize}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
  
  const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];

  const sectionsToExport = allSections.map(section => ({
      ...section,
      rows: section.rows.filter(row => row.total !== 0)
  })).filter(section => section.rows.length > 0);

  let yPos = 0;
  const pageTopMargin = 15;
  const pageLeftMargin = 14;
  const pageRightMargin = 14;

  const addFooter = () => {
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150);
          
          const preparedByText = `Prepared by: ${userName || 'N/A'}`;
          doc.text(preparedByText, pageLeftMargin, pageHeight - 15);
          doc.text('Signature: ..........................', pageLeftMargin, pageHeight - 10);
          
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 35, pageHeight - 10);
      }
  };
  
  const qrCodeSize = 40;
  const qrCodeX = doc.internal.pageSize.width - qrCodeSize - pageRightMargin;
  
  doc.setFontSize(22);
  doc.text("Cost Calculation Report", pageLeftMargin, pageTopMargin + 7);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Group ID: ${report.groupId}`, pageLeftMargin, pageTopMargin + 15);
  
  doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, pageTopMargin, qrCodeSize, qrCodeSize);

  yPos = Math.max(pageTopMargin + 25, pageTopMargin + qrCodeSize) + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Group Details", pageLeftMargin, yPos);
  yPos += 7;
  autoTable(doc, {
      startY: yPos,
      body: [
          ['Trek Name', selectedTrek.name || 'N/A'],
          ['Group Size', report.groupSize.toString()],
          ['Start Date', report.startDate ? format(report.startDate, 'PPP') : 'N/A'],
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
        `$${row.rate.toFixed(2)}`,
        row.no,
        row.times,
        `$${row.total.toFixed(2)}`
    ]);
    const {subtotal, total} = calculateSectionTotals(section);

    body.push(['', 'Subtotal', '', '', '', `$${subtotal.toFixed(2)}`]);
    if (section.discount > 0) {
      body.push(['', 'Discount', '', '', '', `- $${section.discount.toFixed(2)}`]);
    }
    body.push(['', 'Total', '', '', '', `$${total.toFixed(2)}`]);

    autoTable(doc, {
        startY: yPos,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [21, 29, 79] }, // #151D4F
        didDrawPage: (data: any) => {
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
      return [`${section.name} Total`, `$${total.toFixed(2)}`];
    });
    summaryData.push(['Grand Total', `$${grandTotal.toFixed(2)}`]);
    
    autoTable(doc, {
        startY: yPos,
        body: summaryData,
        theme: 'plain'
    });
  }

  addFooter();

  doc.save(`cost-report-${report.groupId.substring(0,8)}.pdf`);
}

export async function handleExportExcel({
  report,
  calculateSectionTotals
}: {
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number },
}) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();
   
   const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];
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

   XLSX.writeFile(wb, `cost-report-${report.groupId.substring(0,8)}.xlsx`);
}
