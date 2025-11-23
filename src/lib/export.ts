"use client";

import { format } from "date-fns";
import type { Trek, SectionState } from "@/lib/types";
import { logoUrl } from "@/components/logo";

type ReportState = {
  groupId: string;
  trekId: string | null;
  trekName: string;
  groupName: string;
  groupSize: number;
  startDate: Date | undefined;
  permits: SectionState;
  services: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  overallDiscountType?: 'amount' | 'percentage';
  overallDiscountValue?: number;
  overallDiscountRemarks?: string;
};

export async function handleExportPDF({
  selectedTrek,
  report,
  calculateSectionTotals,
  userName,
  includeServiceCharge
}: {
  selectedTrek: Trek | undefined,
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number, discountAmount: number },
  userName?: string,
  includeServiceCharge: boolean
}) {
  if (!selectedTrek) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { default: QRCode } = await import("qrcode");

  const doc = new jsPDF();
  doc.setFont("helvetica");

  const qrCodeUrl = `${window.location.origin}/report/${report.groupId}?groupSize=${report.groupSize}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

  const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];

  const sectionsToExport = allSections.map(section => ({
    ...section,
    rows: section.rows.filter(row => row.total !== 0)
  })).filter(section => section.rows.length > 0 || section.discountValue > 0);

  let yPos = 0;
  const pageTopMargin = 20;
  const pageLeftMargin = 14;
  const pageRightMargin = 14;
  const brandColor: [number, number, number] = [21, 29, 79]; // #151D4F

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

  const qrCodeSize = 35;
  const qrCodeX = doc.internal.pageSize.width - qrCodeSize - pageRightMargin;

  // Header
  const logoWidth = 50;
  const logoHeight = (logoWidth * 54) / 256; // Maintain aspect ratio
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  const reader = new FileReader();
  const dataUrl = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  doc.addImage(dataUrl as string, 'PNG', pageLeftMargin, pageTopMargin - 12, logoWidth, logoHeight);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text("Cost Calculation Report", doc.internal.pageSize.width - pageRightMargin, pageTopMargin, { align: "right" });
  doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, pageTopMargin + 5, qrCodeSize, qrCodeSize);

  yPos = Math.max(pageTopMargin + 20, pageTopMargin + qrCodeSize);

  doc.setDrawColor(200);
  doc.line(pageLeftMargin, yPos, doc.internal.pageSize.width - pageRightMargin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Group ID: ${report.groupId}`, pageLeftMargin, yPos - 5);


  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Group Details", pageLeftMargin, yPos + 5);
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Trek Name', selectedTrek.name || 'N/A'],
      ['Group Name', report.groupName || 'N/A'],
      ['Group Size', report.groupSize.toString()],
      ['Start Date', report.startDate ? format(report.startDate, 'PPP') : 'N/A'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  sectionsToExport.forEach(section => {
    if (yPos > 250) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(section.name, pageLeftMargin, yPos);
    yPos += 8;

    const head = [['#', 'Description', 'Rate', 'No', 'Times', 'Total']];
    const body = section.rows.map((row, i) => [
      i + 1,
      row.description,
      `$${row.rate.toFixed(2)}`,
      row.no,
      row.times,
      `$${row.total.toFixed(2)}`
    ]);
    const { subtotal, total, discountAmount } = calculateSectionTotals(section);

    body.push(['', 'Subtotal', '', '', '', `$${subtotal.toFixed(2)}`]);
    if (section.discountValue > 0) {
      const discountLabel = section.discountType === 'percentage'
        ? `Discount (${section.discountValue}%)`
        : 'Discount';
      body.push(['', discountLabel, '', '', '', `- $${discountAmount.toFixed(2)}`]);
    }
    body.push(['', 'Total', '', '', '', `$${total.toFixed(2)}`]);

    autoTable(doc, {
      startY: yPos,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: brandColor, font: 'helvetica' },
      styles: { font: 'helvetica' },
      didDrawPage: (data: any) => {
        yPos = data.cursor?.y || yPos;
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  });

  const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);

  // Calculate overall discount
  const overallDiscountAmount = report.overallDiscountValue && report.overallDiscountValue > 0
    ? (report.overallDiscountType === 'percentage'
      ? (grandTotal * (report.overallDiscountValue / 100))
      : report.overallDiscountValue)
    : 0;

  const totalAfterOverallDiscount = grandTotal - overallDiscountAmount;
  const totalWithService = totalAfterOverallDiscount * (1 + report.serviceCharge / 100);

  if (sectionsToExport.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = pageTopMargin;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", pageLeftMargin, yPos);
    yPos += 8;

    const summaryData = sectionsToExport.map(section => {
      const { total } = calculateSectionTotals(section);
      return [`${section.name} Total`, `$${total.toFixed(2)}`];
    });

    summaryData.push(['Subtotal (All Sections)', `$${grandTotal.toFixed(2)}`]);

    // Add overall discount if present
    if (overallDiscountAmount > 0) {
      const discountLabel = report.overallDiscountType === 'percentage'
        ? `Overall Discount (${report.overallDiscountValue}%)`
        : 'Overall Discount';

      summaryData.push([discountLabel, `- $${overallDiscountAmount.toFixed(2)}`]);
      summaryData.push(['Total after Overall Discount', `$${totalAfterOverallDiscount.toFixed(2)}`]);
    }

    if (includeServiceCharge) {
      const serviceAmount = totalAfterOverallDiscount * (report.serviceCharge / 100);
      summaryData.push([`Service Charge (${report.serviceCharge}%)`, `$${serviceAmount.toFixed(2)}`]);
      summaryData.push(['Grand Total with Service', `$${totalWithService.toFixed(2)}`]);
    } else if (overallDiscountAmount === 0) {
      summaryData.push(['Grand Total', `$${grandTotal.toFixed(2)}`]);
    }

    if (report.groupSize > 0) {
      const finalCost = includeServiceCharge ? totalWithService : totalAfterOverallDiscount;
      summaryData.push(['Cost Per Person', `$${(finalCost / report.groupSize).toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'grid',
      styles: { font: 'helvetica' },
      columnStyles: { 0: { fontStyle: 'bold' } },
    });
  }

  addFooter();

  doc.save(`cost-report-${report.groupId.substring(0, 8)}.pdf`);
}

export async function handleExportExcel({
  report,
  calculateSectionTotals
}: {
  report: ReportState,
  calculateSectionTotals: (section: SectionState) => { subtotal: number, total: number, discountAmount: number },
}) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const allSections = [report.permits, report.services, ...report.customSections, report.extraDetails];
  const sectionsToExport = allSections.map(section => ({
    ...section,
    rows: section.rows.filter(row => row.total !== 0)
  })).filter(section => {
    return section.rows.length > 0 || section.discountValue > 0;
  });

  sectionsToExport.forEach(section => {
    const { subtotal, total, discountAmount } = calculateSectionTotals(section);
    const wsData = section.rows.map(row => ({
      Description: row.description,
      Rate: row.rate,
      No: row.no,
      Times: row.times,
      Total: row.total,
    }));
    wsData.push({ Description: 'Subtotal', Rate: 0, No: 0, Times: 0, Total: subtotal });
    if (section.discountValue > 0) {
      const discountLabel = section.discountType === 'percentage'
        ? `Discount (${section.discountValue}%)`
        : 'Discount';
      wsData.push({ Description: discountLabel, Rate: 0, No: 0, Times: 0, Total: -discountAmount });
    }
    wsData.push({ Description: 'Total', Rate: 0, No: 0, Times: 0, Total: total });
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, section.name.substring(0, 31));
  });

  const grandTotal = sectionsToExport.reduce((acc, section) => acc + calculateSectionTotals(section).total, 0);

  // Calculate overall discount
  const overallDiscountAmount = report.overallDiscountValue && report.overallDiscountValue > 0
    ? (report.overallDiscountType === 'percentage'
      ? (grandTotal * (report.overallDiscountValue / 100))
      : report.overallDiscountValue)
    : 0;

  const totalAfterOverallDiscount = grandTotal - overallDiscountAmount;

  if (sectionsToExport.length > 0) {
    const summaryWsData = sectionsToExport.map(section => {
      const { total } = calculateSectionTotals(section);
      return { Item: `${section.name} Total`, Amount: total };
    });

    summaryWsData.push({ Item: 'Subtotal (All Sections)', Amount: grandTotal });

    // Add overall discount if present
    if (overallDiscountAmount > 0) {
      const discountLabel = report.overallDiscountType === 'percentage'
        ? `Overall Discount (${report.overallDiscountValue}%)`
        : 'Overall Discount';
      summaryWsData.push({ Item: discountLabel, Amount: -overallDiscountAmount });
      summaryWsData.push({ Item: 'Total after Overall Discount', Amount: totalAfterOverallDiscount });
    } else {
      summaryWsData.push({ Item: 'Grand Total', Amount: grandTotal });
    }

    const summaryWs = XLSX.utils.json_to_sheet(summaryWsData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  }

  XLSX.writeFile(wb, `cost-report-${report.groupId.substring(0, 8)}.xlsx`);
}
