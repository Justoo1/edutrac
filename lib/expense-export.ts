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

interface CategoryData {
  count: number;
  total: number;
}

interface CategoryBreakdown {
  [category: string]: CategoryData;
}

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number
    }
  }
}

export interface ExpenseExportData {
  expenseData: any[]
  school: any
  summary: any
  dateRange?: {
    startDate: string
    endDate: string
  }
  categoryFilter?: string
  statusFilter?: string
  selectedExpenses?: string[]
}

export class ExpensePDFExporter {
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

  generateExpenseReport(data: ExpenseExportData): void {
    const { expenseData, school, summary, dateRange, categoryFilter, statusFilter, selectedExpenses } = data
    console.log({expenseData, school, summary, dateRange, categoryFilter, statusFilter, selectedExpenses});
    
    // Filter expense data if specific expenses selected
    const filteredExpenses = selectedExpenses && selectedExpenses.length > 0 
      ? expenseData.filter(expense => selectedExpenses.includes(expense.expense?.id || expense.id))
      : expenseData

    this.addHeader(school, dateRange, categoryFilter, statusFilter);
    this.addSummarySection(summary, filteredExpenses.length);
    this.addExpenseTable(filteredExpenses);
    this.addCategoryBreakdown(filteredExpenses);
    this.addFooter();

    // Download the PDF
    const fileName = `Expense_Report_${dateRange ? `${dateRange.startDate}_to_${dateRange.endDate}` : new Date().toISOString().slice(0, 10)}_${school?.name || 'School'}.pdf`;
    this.doc.save(fileName);
  }

  private addHeader(school: any, dateRange?: { startDate: string, endDate: string }, categoryFilter?: string, statusFilter?: string): void {
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
    const title = 'EXPENSE REPORT';
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - titleWidth) / 2, this.margin + 55);

    // Date Range and Filters
    let filterText = '';
    if (dateRange) {
      filterText += `Period: ${this.formatDate(dateRange.startDate)} to ${this.formatDate(dateRange.endDate)}`;
    }
    if (categoryFilter && categoryFilter !== 'all') {
      filterText += filterText ? ` | Category: ${categoryFilter}` : `Category: ${categoryFilter}`;
    }
    if (statusFilter && statusFilter !== 'all') {
      filterText += filterText ? ` | Status: ${statusFilter}` : `Status: ${statusFilter}`;
    }
    
    if (filterText) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      const filterWidth = this.doc.getTextWidth(filterText);
      this.doc.text(filterText, (this.pageWidth - filterWidth) / 2, this.margin + 65);
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

  private addSummarySection(summary: any, expenseCount: number): void {
    const startY = this.margin + 85;

    // Summary Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('EXPENSE SUMMARY', this.margin, startY);

    // Summary Cards - Make them wider and taller
    const cardWidth = (this.pageWidth - this.margin * 2 - 15) / 4;
    const cardHeight = 45;
    const cardY = startY + 15;

    const summaryData = [
      {
        title: 'Total Expenses',
        value: expenseCount.toString(),
        color: [59, 130, 246] as [number, number, number] // Blue
      },
      {
        title: 'Total Amount',
        value: `GHS ${(summary?.totalExpenses || 0).toLocaleString()}`,
        color: [16, 185, 129] as [number, number, number] // Green
      },
      {
        title: 'Paid Amount',
        value: `GHS ${(summary?.paidExpenses || 0).toLocaleString()}`,
        color: [34, 197, 94] as [number, number, number] // Emerald
      },
      {
        title: 'Pending Amount',
        value: `GHS ${(summary?.pendingExpenses || 0).toLocaleString()}`,
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

  private addExpenseTable(expenseData: any[]): void {
    const startY = this.margin + 155; // Adjust for taller summary cards

    // Table Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('EXPENSE DETAILS', this.margin, startY);

    // Prepare table data
    const tableColumns = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Vendor', dataKey: 'vendor' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' }
    ];

    const tableRows = expenseData.map(item => {
      // Handle both nested expense objects and direct expense objects
      const expense = item.expense || item;
      return {
        date: this.formatDate(expense.expenseDate),
        description: this.truncateText(expense.description || 'N/A', 25),
        category: expense.category || 'N/A',
        vendor: this.truncateText(expense.vendor || 'N/A', 20),
        department: expense.department || 'N/A',
        amount: `GHS ${(expense.amount || 0).toLocaleString()}`,
        status: this.formatStatus(expense.status || 'pending')
      };
    });

    // Add table with improved column widths
    autoTable(this.doc, {
      startY: startY + 15,
      head: [tableColumns.map(col => col.header)],
      body: tableRows.map(row => [
        row.date,
        row.description,
        row.category,
        row.vendor,
        row.department,
        row.amount,
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
        0: { cellWidth: 20 }, // Date
        1: { cellWidth: 35 }, // Description - wider
        2: { cellWidth: 25 }, // Category
        3: { cellWidth: 25 }, // Vendor
        4: { cellWidth: 25 }, // Department
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Amount
        6: { cellWidth: 18, halign: 'center' } // Status
      },
      margin: { left: this.margin, right: this.margin },
      didParseCell: function(data: any) {
        // Color status cells
        if (data.column.index === 6) { // Status column
          const status = data.cell.text[0].toLowerCase();
          if (status.includes('paid') || status.includes('approved')) {
            data.cell.styles.fillColor = [220, 252, 231]; // Light green
            data.cell.styles.textColor = [22, 101, 52]; // Dark green
          } else if (status.includes('pending')) {
            data.cell.styles.fillColor = [254, 243, 199]; // Light amber
            data.cell.styles.textColor = [146, 64, 14]; // Dark amber
          } else if (status.includes('rejected')) {
            data.cell.styles.fillColor = [254, 226, 226]; // Light red
            data.cell.styles.textColor = [153, 27, 27]; // Dark red
          }
        }
      }
    });

    // Add totals row
    this.addTotalsRow(expenseData);
  }

  private addTotalsRow(expenseData: any[]): void {
    const totals = expenseData.reduce((acc, item) => {
      const expense = item.expense || item;
      const amount = expense.amount || 0;
      const status = expense.status || 'pending';
      
      acc.total += amount;
      if (status === 'paid' || status === 'approved') {
        acc.paid += amount;
      } else if (status === 'pending') {
        acc.pending += amount;
      } else if (status === 'rejected') {
        acc.rejected += amount;
      }
      return acc;
    }, { total: 0, paid: 0, pending: 0, rejected: 0 });

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
    this.doc.text(`Total: GHS ${totals.total.toLocaleString()}`, this.margin + 45, finalY + 8);
    this.doc.text(`Paid: GHS ${totals.paid.toLocaleString()}`, this.margin + 110, finalY + 8);
    
    // Second row of totals
    this.doc.text(`Pending: GHS ${totals.pending.toLocaleString()}`, this.margin + 5, finalY + 18);
    this.doc.text(`Rejected: GHS ${totals.rejected.toLocaleString()}`, this.margin + 100, finalY + 18);
  }

  private addCategoryBreakdown(expenseData: any[]): void {
    const finalY = (this.doc.lastAutoTable?.finalY || this.pageHeight - 100) + 50;
    
    // Check if we need a new page
    if (finalY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentPage++;
      this.addPageHeader();
    }

    const categoryBreakdown: CategoryBreakdown = expenseData.reduce((acc, item) => {
      const expense = item.expense || item;
      const category = expense.category || 'Other';
      const amount = expense.amount || 0;
      
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number, count: number }>);

    const startY = finalY > this.pageHeight - 100 ? this.margin + 60 : finalY;

    // Category breakdown title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('CATEGORY BREAKDOWN', this.margin, startY);

    // Category breakdown table
    const categoryData = Object.entries(categoryBreakdown).map(([category, data]) => [
      category,
      data.count.toString(),
      `GHS ${data.total.toLocaleString()}`,
      `${((data.total / expenseData.reduce((sum, item) => sum + ((item.expense || item).amount || 0), 0)) * 100).toFixed(1)}%`
    ]);

    autoTable(this.doc, {
      startY: startY + 15,
      head: [['Category', 'Count', 'Amount', 'Percentage']],
      body: categoryData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Category
        1: { cellWidth: 30, halign: 'center' }, // Count
        2: { cellWidth: 40, halign: 'right' }, // Amount
        3: { cellWidth: 30, halign: 'center' } // Percentage
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  private addPageHeader(): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(59, 130, 246);
    this.doc.text('EXPENSE REPORT (Continued)', this.margin, this.margin + 20);
    
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.margin + 30, this.pageWidth - this.margin, this.margin + 30);
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
    
    this.doc.text('This is a computer-generated expense report.', this.margin, footerY + 10);
    this.doc.text('For inquiries, contact the school administration.', this.margin, footerY + 18);
    
    // Page number
    const pageText = `Page ${this.currentPage}`;
    const pageWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 18);
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  private formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Export functions
export const exportExpenseToPDF = (data: ExpenseExportData) => {
  const exporter = new ExpensePDFExporter();
  exporter.generateExpenseReport(data);
};

// CSV Export function
export const exportExpenseToCSV = (data: ExpenseExportData) => {
  const { expenseData, selectedExpenses, dateRange, categoryFilter, statusFilter } = data;

  // Filter expense data if specific expenses selected
  const filteredExpenses = selectedExpenses && selectedExpenses.length > 0 
    ? expenseData.filter(item => selectedExpenses.includes((item.expense || item).id))
    : expenseData;

  const csvHeaders = [
    'Date',
    'Expense ID',
    'Description',
    'Category',
    'Vendor',
    'Department',
    'Amount (GHS)',
    'Payment Method',
    'Payment Reference',
    'Status',
    'Notes',
    'Created Date',
    'Approved Date'
  ];

  const csvRows = filteredExpenses.map(item => {
    const expense = item.expense || item;
    return [
      expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '',
      expense.id || '',
      expense.description || '',
      expense.category || '',
      expense.vendor || '',
      expense.department || '',
      expense.amount || 0,
      expense.paymentMethod || '',
      expense.paymentReference || '',
      expense.status || 'pending',
      expense.notes || '',
      expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '',
      expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : ''
    ];
  });

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
    link.setAttribute('download', `Expense_Export_${dateRange ? `${dateRange.startDate}_to_${dateRange.endDate}` : new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Excel Export function using ExcelJS
export const exportExpenseToExcel = async (data: ExpenseExportData) => {
  try {
    // Dynamic import to avoid SSR issues
    const ExcelJS = await import('exceljs')
    const { expenseData, school, summary, selectedExpenses, dateRange, categoryFilter, statusFilter } = data

    // Filter expense data if specific expenses selected
    const filteredExpenses = selectedExpenses && selectedExpenses.length > 0 
      ? expenseData.filter(item => selectedExpenses.includes((item.expense || item).id))
      : expenseData

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Expense Report')

    // Set column widths
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Expense ID', key: 'id', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Amount (GHS)', key: 'amount', width: 18 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Payment Reference', key: 'paymentReference', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
      { header: 'Approved Date', key: 'approvedAt', width: 15 }
    ]

    // Add title row
    worksheet.addRow([])
    const titleRow = worksheet.addRow([`${school?.name || 'School'} - Expense Report`])
    titleRow.font = { size: 16, bold: true }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells('A2:M2')

    // Add filter info if applicable
    if (dateRange || categoryFilter || statusFilter) {
      let filterText = '';
      if (dateRange) {
        filterText += `Period: ${dateRange.startDate} to ${dateRange.endDate}`;
      }
      if (categoryFilter && categoryFilter !== 'all') {
        filterText += filterText ? ` | Category: ${categoryFilter}` : `Category: ${categoryFilter}`;
      }
      if (statusFilter && statusFilter !== 'all') {
        filterText += filterText ? ` | Status: ${statusFilter}` : `Status: ${statusFilter}`;
      }
      
      if (filterText) {
        const filterRow = worksheet.addRow([filterText]);
        filterRow.font = { size: 12 }
        filterRow.alignment = { horizontal: 'center' }
        worksheet.mergeCells('A3:M3')
      }
    }

    // Add empty row
    worksheet.addRow([])

    // Add summary section
    worksheet.addRow(['SUMMARY'])
    worksheet.addRow(['Total Expenses:', filteredExpenses.length])
    worksheet.addRow(['Total Amount:', `GHS ${(summary?.totalExpenses || 0).toLocaleString()}`])
    worksheet.addRow(['Paid Amount:', `GHS ${(summary?.paidExpenses || 0).toLocaleString()}`])
    worksheet.addRow(['Pending Amount:', `GHS ${(summary?.pendingExpenses || 0).toLocaleString()}`])

    // Add empty rows
    worksheet.addRow([])
    worksheet.addRow([])

    // Add header row
    const headerRow = worksheet.addRow([
      'Date', 'Expense ID', 'Description', 'Category', 'Vendor', 'Department',
      'Amount (GHS)', 'Payment Method', 'Payment Reference', 'Status', 'Notes',
      'Created Date', 'Approved Date'
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
    filteredExpenses.forEach(item => {
      const expense = item.expense || item;
      worksheet.addRow([
        expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '',
        expense.id || '',
        expense.description || '',
        expense.category || '',
        expense.vendor || '',
        expense.department || '',
        expense.amount || 0,
        expense.paymentMethod || '',
        expense.paymentReference || '',
        expense.status || 'pending',
        expense.notes || '',
        expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '',
        expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : ''
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
    link.setAttribute('download', `Expense_Report_${dateRange ? `${dateRange.startDate}_to_${dateRange.endDate}` : new Date().toISOString().slice(0, 10)}_${school?.name || 'School'}.xlsx`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    // Fallback to CSV if Excel export fails
    exportExpenseToCSV(data)
    alert('Excel export failed. Downloaded as CSV instead.')
  }
}
