import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Type declaration for autoTable
type AutoTableOptions = {
  startY?: number
  head?: any[][]
  body?: any[][]
  theme?: string
  headStyles?: any
  bodyStyles?: any
  alternateRowStyles?: any
  columnStyles?: any
  margin?: any
  didParseCell?: (data: any) => void
  [key: string]: any
}

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number
    }
  }
}

export interface PayrollExportData {
  staffData: any[]
  school: any
  summary: any
  payPeriod?: string
  selectedStaff?: string[]
}

export class PayrollPDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentPage: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentPage = 1;
  }

  generatePayrollReport(data: PayrollExportData): void {
    const { staffData, school, summary, payPeriod, selectedStaff } = data
    console.log({staffData, school, summary, payPeriod, selectedStaff});
    // Filter staff data if specific staff selected
    const filteredStaff = selectedStaff && selectedStaff.length > 0 
      ? staffData.filter(staff => selectedStaff.includes(staff.id))
      : staffData

    this.addHeader(school, payPeriod);
    this.addSummarySection(summary, filteredStaff.length);
    this.addStaffTable(filteredStaff);
    this.addFooter();

    // Download the PDF
    const fileName = `Payroll_Report_${payPeriod || new Date().toISOString().slice(0, 7)}_${school?.name || 'School'}.pdf`;
    this.doc.save(fileName);
  }

  private addHeader(school: any, payPeriod?: string): void {
    // School Logo (placeholder - you can add actual logo later)
    this.doc.setFillColor(59, 130, 246); // Blue color
    this.doc.rect(this.margin, this.margin, 30, 20, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LOGO', this.margin + 10, this.margin + 12);

    // School Name and Details
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(school?.name || 'School Name', this.margin + 40, this.margin + 15);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(school?.address || 'School Address', this.margin + 40, this.margin + 25);
    this.doc.text(`Phone: ${school?.phone || 'N/A'} | Email: ${school?.email || 'N/A'}`, this.margin + 40, this.margin + 32);

    // Report Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(59, 130, 246);
    const title = 'PAYROLL REPORT';
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - titleWidth) / 2, this.margin + 55);

    // Pay Period
    if (payPeriod) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      const periodText = `Pay Period: ${this.formatPayPeriod(payPeriod)}`;
      const periodWidth = this.doc.getTextWidth(periodText);
      this.doc.text(periodText, (this.pageWidth - periodWidth) / 2, this.margin + 65);
    }

    // Generation Date
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    const dateText = `Generated on: ${new Date().toLocaleString()}`;
    const dateWidth = this.doc.getTextWidth(dateText);
    this.doc.text(dateText, this.pageWidth - this.margin - dateWidth, this.margin + 10);

    // Add a line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.margin + 75, this.pageWidth - this.margin, this.margin + 75);
  }

  private addSummarySection(summary: any, staffCount: number): void {
    const startY = this.margin + 85;

    // Summary Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('PAYROLL SUMMARY', this.margin, startY);

    // Summary Cards - Make them wider and taller
    const cardWidth = (this.pageWidth - this.margin * 2 - 15) / 4;
    const cardHeight = 45;
    const cardY = startY + 15;

    const summaryData = [
      {
        title: 'Total Staff',
        value: staffCount.toString(),
        color: [59, 130, 246] as [number, number, number] // Blue
      },
      {
        title: 'Total Budget',
        value: `GHS ${(summary?.totalSalaryBudget || 0).toLocaleString()}`,
        color: [16, 185, 129] as [number, number, number] // Green
      },
      {
        title: 'Paid Amount',
        value: `GHS ${(summary?.paidSalaries || 0).toLocaleString()}`,
        color: [34, 197, 94] as [number, number, number] // Emerald
      },
      {
        title: 'Pending Amount',
        value: `GHS ${(summary?.pendingSalaries || 0).toLocaleString()}`,
        color: [245, 158, 11] as [number, number, number] // Amber
      }
    ];

    summaryData.forEach((item, index) => {
      const x = this.margin + (cardWidth + 5) * index;

      // Card background
      this.doc.setFillColor(...item.color);
      this.doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');

      // Title
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.title, x + 8, cardY + 15);

      // Value
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, x + 8, cardY + 32);
    });
  }

  private addStaffTable(staffData: any[]): void {
    const startY = this.margin + 155; // Adjust for taller summary cards

    // Table Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('STAFF SALARY DETAILS', this.margin, startY);

    // Prepare table data
    const tableColumns = [
      { header: 'Staff Name', dataKey: 'name' },
      { header: 'Position', dataKey: 'position' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Base Salary', dataKey: 'baseSalary' },
      { header: 'Allowances', dataKey: 'allowances' },
      { header: 'Deductions', dataKey: 'deductions' },
      { header: 'Net Salary', dataKey: 'netSalary' },
      { header: 'Status', dataKey: 'status' }
    ];

    const tableRows = staffData.map(staff => ({
      name: staff.name || 'N/A',
      position: staff.position || 'N/A',
      department: staff.department || 'N/A',
      baseSalary: `GHS ${(staff.baseSalary || 0).toLocaleString()}`,
      allowances: `GHS ${(staff.allowances || 0).toLocaleString()}`,
      deductions: `GHS ${(staff.deductions || 0).toLocaleString()}`,
      netSalary: `GHS ${(staff.netSalary || 0).toLocaleString()}`,
      status: this.formatStatus(staff.paymentStatus || staff.status || 'pending')
    }));

    // Add table with improved column widths
    autoTable(this.doc, {
      startY: startY + 15,
      head: [tableColumns.map(col => col.header)],
      body: tableRows.map(row => [
        row.name,
        row.position,
        row.department,
        row.baseSalary,
        row.allowances,
        row.deductions,
        row.netSalary,
        row.status
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Name - wider
        1: { cellWidth: 22 }, // Position
        2: { cellWidth: 25 }, // Department - wider
        3: { cellWidth: 22, halign: 'right' }, // Base Salary
        4: { cellWidth: 22, halign: 'right' }, // Allowances
        5: { cellWidth: 22, halign: 'right' }, // Deductions
        6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Net Salary - wider
        7: { cellWidth: 18, halign: 'center' } // Status
      },
      margin: { left: this.margin, right: this.margin },
      didParseCell: function(data: any) {
        // Color status cells
        if (data.column.index === 7) { // Status column
          const status = data.cell.text[0].toLowerCase();
          if (status.includes('paid')) {
            data.cell.styles.fillColor = [220, 252, 231]; // Light green
            data.cell.styles.textColor = [22, 101, 52]; // Dark green
          } else if (status.includes('pending')) {
            data.cell.styles.fillColor = [254, 243, 199]; // Light amber
            data.cell.styles.textColor = [146, 64, 14]; // Dark amber
          } else if (status.includes('processing')) {
            data.cell.styles.fillColor = [219, 234, 254]; // Light blue
            data.cell.styles.textColor = [30, 64, 175]; // Dark blue
          }
        }
      }
    });

    // Add totals row
    this.addTotalsRow(staffData);
  }

  private addTotalsRow(staffData: any[]): void {
    const totals = staffData.reduce((acc, staff) => ({
      baseSalary: acc.baseSalary + (staff.baseSalary || 0),
      allowances: acc.allowances + (staff.allowances || 0),
      deductions: acc.deductions + (staff.deductions || 0),
      netSalary: acc.netSalary + (staff.netSalary || 0)
    }), { baseSalary: 0, allowances: 0, deductions: 0, netSalary: 0 });

    const finalY = (this.doc.lastAutoTable?.finalY || this.pageHeight - 100) + 15;

    // Totals background - make it taller
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(this.margin, finalY, this.pageWidth - this.margin * 2, 25, 'F');

    // Totals text with better spacing and smaller font
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    
    // First row of totals
    this.doc.text('TOTALS:', this.margin + 5, finalY + 8);
    this.doc.text(`Base: GHS ${totals.baseSalary.toLocaleString()}`, this.margin + 45, finalY + 8);
    this.doc.text(`Allowances: GHS ${totals.allowances.toLocaleString()}`, this.margin + 110, finalY + 8);
    
    // Second row of totals
    this.doc.text(`Deductions: GHS ${totals.deductions.toLocaleString()}`, this.margin + 5, finalY + 18);
    this.doc.text(`NET TOTAL: GHS ${totals.netSalary.toLocaleString()}`, this.margin + 100, finalY + 18);
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 30;

    // Footer line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

    // Footer text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    
    this.doc.text('This is a computer-generated payroll report.', this.margin, footerY + 10);
    this.doc.text('For inquiries, contact the school administration.', this.margin, footerY + 18);
    
    // Page number
    const pageText = `Page ${this.currentPage}`;
    const pageWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 18);
  }

  private formatPayPeriod(payPeriod: string): string {
    try {
      const [year, month] = payPeriod.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    } catch {
      return payPeriod;
    }
  }

  private formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Export functions
export const exportPayrollToPDF = (data: PayrollExportData) => {
  const exporter = new PayrollPDFExporter();
  exporter.generatePayrollReport(data);
};

// CSV Export function
export const exportPayrollToCSV = (data: PayrollExportData) => {
  const { staffData, selectedStaff, payPeriod } = data;

  // Filter staff data if specific staff selected
  const filteredStaff = selectedStaff && selectedStaff.length > 0 
    ? staffData.filter(staff => selectedStaff.includes(staff.id))
    : staffData;

  const csvHeaders = [
    'Staff Name',
    'Employee ID', 
    'Position',
    'Department',
    'Base Salary (GHS)',
    'Allowances (GHS)',
    'Deductions (GHS)',
    'Net Salary (GHS)',
    'Payment Status',
    'Payment Method',
    'Account Number',
    'Last Payment Date'
  ];

  const csvRows = filteredStaff.map(staff => [
    staff.name || '',
    staff.id || '',
    staff.position || '',
    staff.department || '',
    staff.baseSalary || 0,
    staff.allowances || 0,
    staff.deductions || 0,
    staff.netSalary || 0,
    staff.paymentStatus || staff.status || 'pending',
    staff.paymentMethod || '',
    staff.accountNumber || '',
    staff.lastPayment ? new Date(staff.lastPayment).toLocaleDateString() : ''
  ]);

  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payroll_Export_${payPeriod || new Date().toISOString().slice(0, 7)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Excel Export function using ExcelJS
export const exportPayrollToExcel = async (data: PayrollExportData) => {
  try {
    // Dynamic import to avoid SSR issues
    const ExcelJS = await import('exceljs')
    const { staffData, school, summary, selectedStaff, payPeriod } = data

    // Filter staff data if specific staff selected
    const filteredStaff = selectedStaff && selectedStaff.length > 0 
      ? staffData.filter(staff => selectedStaff.includes(staff.id))
      : staffData

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Payroll Report')

    // Set column widths
    worksheet.columns = [
      { header: 'Staff Name', key: 'name', width: 25 },
      { header: 'Employee ID', key: 'id', width: 15 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Base Salary (GHS)', key: 'baseSalary', width: 18 },
      { header: 'Allowances (GHS)', key: 'allowances', width: 18 },
      { header: 'Deductions (GHS)', key: 'deductions', width: 18 },
      { header: 'Net Salary (GHS)', key: 'netSalary', width: 18 },
      { header: 'Payment Status', key: 'status', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Last Payment', key: 'lastPayment', width: 15 }
    ]

    // Add title row
    worksheet.addRow([])
    const titleRow = worksheet.addRow([`${school?.name || 'School'} - Payroll Report`])
    titleRow.font = { size: 16, bold: true }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells('A2:L2')

    if (payPeriod) {
      const periodRow = worksheet.addRow([`Pay Period: ${payPeriod}`])
      periodRow.font = { size: 12 }
      periodRow.alignment = { horizontal: 'center' }
      worksheet.mergeCells('A3:L3')
    }

    // Add empty row
    worksheet.addRow([])

    // Add summary section
    worksheet.addRow(['SUMMARY'])
    worksheet.addRow(['Total Staff:', filteredStaff.length])
    worksheet.addRow(['Total Budget:', `GHS ${(summary?.totalSalaryBudget || 0).toLocaleString()}`])
    worksheet.addRow(['Paid Amount:', `GHS ${(summary?.paidSalaries || 0).toLocaleString()}`])
    worksheet.addRow(['Pending Amount:', `GHS ${(summary?.pendingSalaries || 0).toLocaleString()}`])

    // Add empty rows
    worksheet.addRow([])
    worksheet.addRow([])

    // Add header row
    const headerRow = worksheet.addRow([
      'Staff Name', 'Employee ID', 'Position', 'Department',
      'Base Salary (GHS)', 'Allowances (GHS)', 'Deductions (GHS)', 'Net Salary (GHS)',
      'Payment Status', 'Payment Method', 'Account Number', 'Last Payment'
    ])
    
    // Style header row
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    }
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

    // Add data rows
    filteredStaff.forEach(staff => {
      worksheet.addRow([
        staff.name || '',
        staff.id || '',
        staff.position || '',
        staff.department || '',
        staff.baseSalary || 0,
        staff.allowances || 0,
        staff.deductions || 0,
        staff.netSalary || 0,
        staff.paymentStatus || staff.status || 'pending',
        staff.paymentMethod || '',
        staff.accountNumber || '',
        staff.lastPayment ? new Date(staff.lastPayment).toLocaleDateString() : ''
      ])
    })

    // Generate Excel file and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Payroll_Report_${payPeriod || new Date().toISOString().slice(0, 7)}_${school?.name || 'School'}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    // Fallback to CSV if Excel export fails
    exportPayrollToCSV(data)
    alert('Excel export failed. Downloaded as CSV instead.')
  }
}
