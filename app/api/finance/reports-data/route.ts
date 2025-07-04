import { NextRequest, NextResponse } from "next/server";
import { getFinancialOverview, getMonthlyFinancialData, getStudentsWithFees } from "@/lib/finance/queries";
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { sql, eq, and, between } from "drizzle-orm";
import { financialTransactions } from "@/lib/schema";

interface ReportApiResponse {
  monthlyFinancialData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    fees: number;
    salaries: number;
    profit: number;
  }>;
  feeCollectionByClass: Array<{
    class: string;
    collected: number;
    pending: number;
    total: number;
    percentage: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  profitMargin: number;
  summary: {
    outstandingFees: number;
    studentsWithOutstanding: number;
    totalStudents: number;
  };
  hasData: boolean;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeExpenses = searchParams.get("includeExpenses") === "true";
    const includeFees = searchParams.get("includeFees") === "true";
    const reportType = searchParams.get("reportType") || "all";
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    console.log("Reports API - Query params:", {
      schoolId,
      startDate,
      endDate,
      includeExpenses,
      includeFees,
      reportType
    });

    // Calculate date range
    const dateRange = calculateDateRange(startDate, endDate);
    console.log("Reports API - Date range:", dateRange);

    // Fetch filtered financial data
    const financialData = await getFilteredFinancialData(
      schoolId, 
      dateRange, 
      { includeExpenses, includeFees, reportType }
    );

    console.log("Reports API - Raw financial data:", financialData);

    // Process data into the expected format
    const processedData = await processFinancialDataForReports(
      financialData,
      schoolId,
      dateRange,
      { includeExpenses, includeFees, reportType }
    );

    console.log("Reports API - Processed data:", processedData);

    return NextResponse.json(processedData);

  } catch (error) {
    console.error("Error in reports data API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function calculateDateRange(startDate?: string | null, endDate?: string | null) {
  const now = new Date();
  
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      label: `${startDate} to ${endDate}`
    };
  }

  // Default to current month if no dates provided
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: startOfMonth,
    endDate: endOfMonth,
    label: `${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}`
  };
}

async function getFilteredFinancialData(
  schoolId: string, 
  dateRange: { startDate: Date; endDate: Date; label: string },
  filters: { includeExpenses: boolean; includeFees: boolean; reportType: string }
) {
  try {
    // Build base conditions
    const conditions = [
      eq(financialTransactions.schoolId, schoolId),
      between(financialTransactions.transactionDate, dateRange.startDate, dateRange.endDate)
    ];

    // Apply type filters
    if (filters.reportType === "fees") {
      conditions.push(eq(financialTransactions.type, 'income'));
    } else if (filters.reportType === "expenses") {
      conditions.push(eq(financialTransactions.type, 'expense'));
    }

    console.log("Query conditions:", conditions);

    // Fetch transactions within date range
    const transactions = await db
      .select({
        id: financialTransactions.id,
        type: financialTransactions.type,
        category: financialTransactions.category,
        description: financialTransactions.description,
        amount: financialTransactions.amount,
        transactionDate: financialTransactions.transactionDate,
        paymentMethod: financialTransactions.paymentMethod
      })
      .from(financialTransactions)
      .where(and(...conditions))
      .orderBy(financialTransactions.transactionDate);

    console.log(`Found ${transactions.length} transactions in date range`);

    // Group by type and category for summary
    const groupedData = await db
      .select({
        type: financialTransactions.type,
        category: financialTransactions.category,
        totalAmount: sql<number>`SUM(${financialTransactions.amount})`,
        transactionCount: sql<number>`COUNT(*)`
      })
      .from(financialTransactions)
      .where(and(...conditions))
      .groupBy(financialTransactions.type, financialTransactions.category);

    console.log("Grouped data:", groupedData);

    return {
      transactions,
      groupedData,
      dateRange
    };

  } catch (error) {
    console.error("Error fetching filtered financial data:", error);
    throw error;
  }
}

async function processFinancialDataForReports(
  financialData: any,
  schoolId: string,
  dateRange: { startDate: Date; endDate: Date; label: string },
  filters: { includeExpenses: boolean; includeFees: boolean; reportType: string }
): Promise<ReportApiResponse> {
  
  const { transactions, groupedData } = financialData;

  // Calculate totals from grouped data
  let totalRevenue = 0;
  let totalExpenses = 0;

  groupedData.forEach((item: any) => {
    const amount = parseFloat(item.totalAmount?.toString() || '0');
    if (item.type === 'income' && filters.includeFees) {
      totalRevenue += amount;
    } else if (item.type === 'expense' && filters.includeExpenses) {
      totalExpenses += amount;
    }
  });

  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

  console.log("Calculated totals:", { totalRevenue, totalExpenses, totalProfit, profitMargin });

  // Process monthly data
  const monthlyData = processMonthlyFinancialData(transactions, dateRange, filters);

  // Process expense breakdown
  const expenseData = processExpenseBreakdown(groupedData, filters.includeExpenses);

  // Get fee collection data (only if we have students data)
  let feeCollectionData: any[] = [];
  let studentsData = { outstandingFees: 0, studentsWithOutstanding: 0, totalStudents: 0 };

  try {
    if (filters.includeFees || filters.reportType === "fees") {
      const studentsWithFees = await getStudentsWithFees(schoolId);
      feeCollectionData = processFeeCollectionData(studentsWithFees);
      studentsData = {
        outstandingFees: studentsWithFees.reduce((sum, student) => sum + student.pendingAmount, 0),
        studentsWithOutstanding: studentsWithFees.filter(student => student.pendingAmount > 0).length,
        totalStudents: studentsWithFees.length
      };
    }
  } catch (error) {
    console.warn("Could not fetch students data for fee collection:", error);
  }

  const hasData = totalRevenue > 0 || totalExpenses > 0;

  return {
    monthlyFinancialData: monthlyData,
    feeCollectionByClass: feeCollectionData,
    expensesByCategory: expenseData,
    totalRevenue,
    totalExpenses,
    totalProfit,
    profitMargin: Number(profitMargin.toFixed(1)),
    summary: studentsData,
    hasData,
    period: {
      startDate: dateRange.startDate.toISOString().split('T')[0],
      endDate: dateRange.endDate.toISOString().split('T')[0],
      label: dateRange.label
    }
  };
}

function processMonthlyFinancialData(
  transactions: any[],
  dateRange: { startDate: Date; endDate: Date },
  filters: { includeExpenses: boolean; includeFees: boolean; reportType: string }
) {
  // Group transactions by month
  const monthlyMap = new Map<string, { revenue: number; expenses: number; fees: number; salaries: number }>();

  // Initialize months in range
  const current = new Date(dateRange.startDate);
  while (current <= dateRange.endDate) {
    const monthKey = current.toLocaleDateString('en-US', { month: 'short' });
    monthlyMap.set(monthKey, { revenue: 0, expenses: 0, fees: 0, salaries: 0 });
    current.setMonth(current.getMonth() + 1);
  }

  // Process transactions
  transactions.forEach(transaction => {
    const date = new Date(transaction.transactionDate);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    const amount = parseFloat(transaction.amount?.toString() || '0');
    
    if (monthlyMap.has(monthKey)) {
      const monthData = monthlyMap.get(monthKey)!;
      
      if (transaction.type === 'income' && filters.includeFees) {
        monthData.revenue += amount;
        monthData.fees += amount;
      } else if (transaction.type === 'expense' && filters.includeExpenses) {
        monthData.expenses += amount;
        if (transaction.category === 'salary') {
          monthData.salaries += amount;
        }
      }
      
      monthlyMap.set(monthKey, monthData);
    }
  });

  // Convert to array format
  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue),
    expenses: Math.round(data.expenses),
    fees: Math.round(data.fees),
    salaries: Math.round(data.salaries),
    profit: Math.round(data.revenue - data.expenses)
  }));
}

function processExpenseBreakdown(groupedData: any[], includeExpenses: boolean) {
  if (!includeExpenses) return [];

  const expenseCategories = groupedData.filter(item => item.type === 'expense');
  const totalExpenses = expenseCategories.reduce((sum, item) => 
    sum + parseFloat(item.totalAmount?.toString() || '0'), 0
  );

  const colors = ['#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EF4444', '#6B7280'];

  return expenseCategories.map((item, index) => {
    const amount = parseFloat(item.totalAmount?.toString() || '0');
    const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    
    // Map category names to display names
    const categoryName = item.category === 'salary' ? 'Staff Salaries' :
                        item.category === 'Utilities' ? 'Utilities' :
                        item.category?.charAt(0).toUpperCase() + item.category?.slice(1) || 'Other';

    return {
      category: categoryName,
      amount,
      percentage,
      color: colors[index % colors.length]
    };
  });
}

function processFeeCollectionData(studentsWithFees: any[]) {
  // Group students by class/grade level
  const classMap = new Map<string, { collected: number; pending: number; total: number; count: number }>();

  studentsWithFees.forEach(student => {
    const className = student.student.currentClass || 'Unknown Class';
    
    if (!classMap.has(className)) {
      classMap.set(className, { collected: 0, pending: 0, total: 0, count: 0 });
    }
    
    const classData = classMap.get(className)!;
    classData.collected += student.paidAmount;
    classData.pending += student.pendingAmount;
    classData.total += student.totalFees;
    classData.count += 1;
    
    classMap.set(className, classData);
  });

  // Convert to array format
  return Array.from(classMap.entries()).map(([className, data]) => {
    const percentage = data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0;
    
    return {
      class: className,
      collected: Math.round(data.collected),
      pending: Math.round(data.pending),
      total: Math.round(data.total),
      percentage
    };
  });
}
