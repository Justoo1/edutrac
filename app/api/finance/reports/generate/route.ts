import { NextRequest, NextResponse } from "next/server";
import { getFinancialOverview, getMonthlyFinancialData, getStudentsWithFees } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";

interface ReportRequest {
  schoolId: string;
  reportType: string;
  period: string;
  format: 'pdf' | 'csv' | 'excel';
  includeCharts: boolean;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReportRequest = await request.json();
    const { schoolId, reportType, period, format, includeCharts, customDateRange } = body;

    if (!schoolId || !reportType || !period || !format) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    console.log('Generating report with params:', body);

    // Calculate date range based on period
    const dateRange = calculateDateRange(period, customDateRange);
    
    // Fetch comprehensive data for the report
    const reportData = await fetchReportData(schoolId, dateRange, reportType);
    
    // Generate report based on format
    switch (format) {
      case 'pdf':
        return await generatePDFReport(reportData, reportType, includeCharts);
      case 'csv':
        return generateCSVReport(reportData, reportType);
      case 'excel':
        return await generateExcelReport(reportData, reportType);
      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateDateRange(period: string, customDateRange?: { startDate: string; endDate: string }) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (period === 'custom' && customDateRange) {
    startDate = new Date(customDateRange.startDate);
    endDate = new Date(customDateRange.endDate);
  } else {
    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current-quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'last-quarter':
        const lastQuarterStart = Math.floor(now.getMonth() / 3) * 3 - 3;
        startDate = new Date(now.getFullYear(), lastQuarterStart, 1);
        endDate = new Date(now.getFullYear(), lastQuarterStart + 3, 0);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Default to last 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }
  }

  return { startDate, endDate };
}

async function fetchReportData(schoolId: string, dateRange: { startDate: Date; endDate: Date }, reportType: string) {
  const currentYear = new Date().getFullYear();
  
  // Fetch all necessary data
  const [overviewData, monthlyData, studentsWithFees] = await Promise.all([
    getFinancialOverview(schoolId, dateRange),
    getMonthlyFinancialData(schoolId, currentYear),
    getStudentsWithFees(schoolId).catch(() => []) // Graceful failure
  ]);

  // Process the data based on report type
  let processedData = {
    overview: overviewData,
    monthly: monthlyData,
    students: studentsWithFees,
    dateRange,
    reportType,
    schoolId,
    generatedAt: new Date().toISOString()
  };

  // Calculate summary statistics
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  overviewData.forEach((item) => {
    const amount = parseFloat(item.totalAmount?.toString() || '0');
    if (item.type === 'income') {
      totalRevenue += amount;
    } else if (item.type === 'expense') {
      totalExpenses += amount;
    }
  });

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Add calculated totals
  processedData = {
    ...processedData,
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Number(profitMargin.toFixed(2)),
      outstandingFees: studentsWithFees.reduce((sum, student) => sum + student.pendingAmount, 0),
      totalStudents: studentsWithFees.length,
      studentsWithOutstanding: studentsWithFees.filter(s => s.pendingAmount > 0).length
    }
  };

  return processedData;
}

async function generatePDFReport(data: any, reportType: string, includeCharts: boolean) {
  // For now, we'll generate a JSON response that the frontend can convert to PDF
  // In production, you'd use a library like puppeteer, jsPDF, or a service like Playwright
  
  const reportContent = {
    title: getReportTitle(reportType),
    generatedAt: new Date().toISOString(),
    dateRange: `${data.dateRange.startDate.toISOString().split('T')[0]} to ${data.dateRange.endDate.toISOString().split('T')[0]}`,
    includeCharts,
    summary: data.summary,
    sections: generateReportSections(data, reportType, includeCharts)
  };

  // Return as JSON for now - frontend will handle PDF generation
  return NextResponse.json({
    type: 'pdf-data',
    content: reportContent,
    message: 'PDF data generated successfully'
  });
}

function generateCSVReport(data: any, reportType: string) {
  let csvContent = '';
  
  // Generate CSV based on report type
  switch (reportType) {
    case 'monthly-summary':
      csvContent = generateMonthlySummaryCSV(data);
      break;
    case 'fee-collection':
      csvContent = generateFeeCollectionCSV(data);
      break;
    case 'expense-analysis':
      csvContent = generateExpenseAnalysisCSV(data);
      break;
    default:
      csvContent = generateDefaultCSV(data);
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportType}-${Date.now()}.csv"`
    }
  });
}

async function generateExcelReport(data: any, reportType: string) {
  // For now, return JSON data that frontend can convert to Excel
  const excelData = {
    sheets: [
      {
        name: 'Summary',
        data: [
          ['Report Type', reportType],
          ['Generated At', data.generatedAt],
          ['Date Range', `${data.dateRange.startDate.toISOString().split('T')[0]} to ${data.dateRange.endDate.toISOString().split('T')[0]}`],
          ['Total Revenue', data.summary.totalRevenue],
          ['Total Expenses', data.summary.totalExpenses],
          ['Net Profit', data.summary.netProfit],
          ['Profit Margin %', data.summary.profitMargin]
        ]
      },
      {
        name: 'Details',
        data: generateDetailedData(data, reportType)
      }
    ]
  };

  return NextResponse.json({
    type: 'excel-data',
    content: excelData,
    message: 'Excel data generated successfully'
  });
}

function getReportTitle(reportType: string): string {
  const titles: { [key: string]: string } = {
    'monthly-summary': 'Monthly Financial Summary',
    'fee-collection': 'Fee Collection Report',
    'expense-analysis': 'Expense Analysis Report',
    'staff-payroll': 'Staff Payroll Report',
    'profit-loss': 'Profit & Loss Statement',
    'budget-variance': 'Budget Variance Report'
  };
  
  return titles[reportType] || 'Financial Report';
}

function generateReportSections(data: any, reportType: string, includeCharts: boolean) {
  const sections = [];

  // Executive Summary
  sections.push({
    title: 'Executive Summary',
    content: [
      `Total Revenue: GH₵${data.summary.totalRevenue.toLocaleString()}`,
      `Total Expenses: GH₵${data.summary.totalExpenses.toLocaleString()}`,
      `Net Profit: GH₵${data.summary.netProfit.toLocaleString()}`,
      `Profit Margin: ${data.summary.profitMargin}%`,
      `Outstanding Fees: GH₵${data.summary.outstandingFees.toLocaleString()}`,
      `Students with Outstanding Fees: ${data.summary.studentsWithOutstanding} of ${data.summary.totalStudents}`
    ]
  });

  // Financial Overview
  if (data.overview && data.overview.length > 0) {
    sections.push({
      title: 'Financial Overview',
      content: data.overview.map((item: any) => 
        `${item.category}: GH₵${parseFloat(item.totalAmount || '0').toLocaleString()} (${item.transactionCount} transactions)`
      )
    });
  }

  // Charts placeholder (if includeCharts is true)
  if (includeCharts) {
    sections.push({
      title: 'Charts and Visualizations',
      content: [
        '[Revenue vs Expenses Trend Chart]',
        '[Expense Breakdown Pie Chart]',
        '[Monthly Performance Chart]'
      ],
      isChart: true
    });
  }

  // Report-specific sections
  switch (reportType) {
    case 'fee-collection':
      if (data.students && data.students.length > 0) {
        sections.push({
          title: 'Fee Collection Details',
          content: data.students.map((student: any) => 
            `${student.student.name}: Paid GH₵${student.paidAmount.toLocaleString()}, Pending GH₵${student.pendingAmount.toLocaleString()}`
          )
        });
      }
      break;
    
    case 'expense-analysis':
      const expensesByCategory = data.overview.filter((item: any) => item.type === 'expense');
      if (expensesByCategory.length > 0) {
        sections.push({
          title: 'Expense Breakdown by Category',
          content: expensesByCategory.map((item: any) => 
            `${item.category}: GH₵${parseFloat(item.totalAmount || '0').toLocaleString()}`
          )
        });
      }
      break;
  }

  return sections;
}

function generateMonthlySummaryCSV(data: any): string {
  const headers = ['Month', 'Revenue', 'Expenses', 'Net Profit'];
  let csv = headers.join(',') + '\n';
  
  // Process monthly data
  if (data.monthly && data.monthly.length > 0) {
    data.monthly.forEach((item: any) => {
      const revenue = item.type === 'income' ? parseFloat(item.totalAmount || '0') : 0;
      const expenses = item.type === 'expense' ? parseFloat(item.totalAmount || '0') : 0;
      const netProfit = revenue - expenses;
      
      csv += `${item.month},${revenue},${expenses},${netProfit}\n`;
    });
  }
  
  return csv;
}

function generateFeeCollectionCSV(data: any): string {
  const headers = ['Student Name', 'Total Fees', 'Paid Amount', 'Pending Amount', 'Payment Status'];
  let csv = headers.join(',') + '\n';
  
  if (data.students && data.students.length > 0) {
    data.students.forEach((student: any) => {
      csv += `"${student.student.name}",${student.totalFees},${student.paidAmount},${student.pendingAmount},"${student.paymentStatus}"\n`;
    });
  }
  
  return csv;
}

function generateExpenseAnalysisCSV(data: any): string {
  const headers = ['Category', 'Amount', 'Transaction Count'];
  let csv = headers.join(',') + '\n';
  
  const expenses = data.overview.filter((item: any) => item.type === 'expense');
  expenses.forEach((item: any) => {
    csv += `"${item.category}",${parseFloat(item.totalAmount || '0')},${item.transactionCount}\n`;
  });
  
  return csv;
}

function generateDefaultCSV(data: any): string {
  const headers = ['Type', 'Category', 'Amount', 'Transaction Count'];
  let csv = headers.join(',') + '\n';
  
  data.overview.forEach((item: any) => {
    csv += `"${item.type}","${item.category}",${parseFloat(item.totalAmount || '0')},${item.transactionCount}\n`;
  });
  
  return csv;
}

function generateDetailedData(data: any, reportType: string): any[][] {
  const detailData = [];
  
  // Add headers
  detailData.push(['Type', 'Category', 'Amount', 'Transactions']);
  
  // Add overview data
  data.overview.forEach((item: any) => {
    detailData.push([
      item.type,
      item.category,
      parseFloat(item.totalAmount || '0'),
      item.transactionCount
    ]);
  });
  
  return detailData;
}
