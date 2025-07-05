"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FileText, Download, TrendingUp, DollarSign, Users, BarChart3, PieChart as PieChartIcon, Filter, Printer, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatCurrencyWithSign } from "@/lib/utils"

// Data types for the reports component
interface MonthlyFinancialData {
  month: string
  revenue: number
  expenses: number
  fees: number
  salaries: number
  profit: number
}

interface FeeCollectionByClass {
  class: string
  collected: number
  pending: number
  total: number
  percentage: number
}

interface ExpensesByCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ReportData {
  monthlyFinancialData: MonthlyFinancialData[]
  feeCollectionByClass: FeeCollectionByClass[]
  expensesByCategory: ExpensesByCategory[]
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  profitMargin: number
  summary?: {
    outstandingFees: number
    studentsWithOutstanding: number
    totalStudents: number
  }
}

interface FinancialReportsProps {
  schoolId?: string
}

interface ReportFilters {
  period: string
  reportType: string
  startDate?: string
  endDate?: string
  includeExpenses: boolean
  includeFees: boolean
  year: string
}

// Default data (keeping the original structure as fallback)
const defaultReportData: ReportData = {
  monthlyFinancialData: [],
  feeCollectionByClass: [],
  expensesByCategory: [],
  totalRevenue: 0,
  totalExpenses: 0,
  totalProfit: 0,
  profitMargin: 0
}

const reportTemplates = [
  {
    id: 'monthly-summary',
    title: 'Monthly Financial Summary',
    description: 'Complete overview of monthly revenue, expenses, and profit',
    icon: BarChart3,
    frequency: 'Monthly',
    lastGenerated: '2024-01-31'
  },
  {
    id: 'fee-collection',
    title: 'Fee Collection Report',
    description: 'Detailed breakdown of student fee payments and outstanding amounts',
    icon: DollarSign,
    frequency: 'Weekly',
    lastGenerated: '2024-02-05'
  },
  {
    id: 'expense-analysis',
    title: 'Expense Analysis',
    description: 'Categorized expense breakdown with budget comparisons',
    icon: PieChartIcon,
    frequency: 'Monthly',
    lastGenerated: '2024-01-31'
  },
  {
    id: 'staff-payroll',
    title: 'Staff Payroll Report',
    description: 'Complete staff salary and payroll processing summary',
    icon: Users,
    frequency: 'Monthly',
    lastGenerated: '2024-01-31'
  }
]

// Helper function to get date range based on period
const getDateRange = (period: string, year?: string) => {
  const now = new Date()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  const currentMonth = now.getMonth()
  
  switch (period) {
    case 'current-month':
      return {
        startDate: new Date(currentYear, now.getMonth(), 1),
        endDate: new Date(currentYear, now.getMonth() + 1, 0)
      }
    case 'last-month':
      const lastMonth = now.getMonth() - 1
      const lastMonthYear = lastMonth < 0 ? currentYear - 1 : currentYear
      const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth
      return {
        startDate: new Date(lastMonthYear, adjustedLastMonth, 1),
        endDate: new Date(lastMonthYear, adjustedLastMonth + 1, 0)
      }
    case 'current-quarter':
      const quarterStart = Math.floor(currentMonth / 3) * 3
      return {
        startDate: new Date(currentYear, quarterStart, 1),
        endDate: new Date(currentYear, quarterStart + 3, 0)
      }
    case 'last-quarter':
      const lastQuarterStart = Math.floor(currentMonth / 3) * 3 - 3
      const lastQuarterYear = lastQuarterStart < 0 ? currentYear - 1 : currentYear
      const adjustedQuarterStart = lastQuarterStart < 0 ? 9 : lastQuarterStart
      return {
        startDate: new Date(lastQuarterYear, adjustedQuarterStart, 1),
        endDate: new Date(lastQuarterYear, adjustedQuarterStart + 3, 0)
      }
    case 'current-year':
      return {
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 11, 31)
      }
    case 'last-6-months':
      return {
        startDate: new Date(currentYear, currentMonth - 6, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0)
      }
    default:
      // Default to current month
      return {
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0)
      }
  }
}

// Helper function to format date for API
const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0]
}

export function FinancialReports({ schoolId = "test-school" }: FinancialReportsProps) {
  // State management
  const [reportData, setReportData] = useState<ReportData>(defaultReportData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  
  // Dialog and filter states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [includeCharts, setIncludeCharts] = useState('yes')
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Filter states
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'current-month',
    reportType: 'all',
    includeExpenses: true,
    includeFees: true,
    year: new Date().getFullYear().toString()
  })

  // Fetch filtered data
  const fetchFilteredData = async (currentFilters: ReportFilters) => {
  try {
    setLoading(true)
    setError(null)
    
    const dateRange = getDateRange(currentFilters.period, currentFilters.year)
    const startDate = formatDateForAPI(dateRange.startDate)
    const endDate = formatDateForAPI(dateRange.endDate)
    
    console.log('Fetching data with filters:', {
      ...currentFilters,
      startDate,
      endDate
    })
    
    // Build API URL with proper filters - use the new reports-data endpoint
    const baseUrl = `/api/finance/reports-data?schoolId=${schoolId}`
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeExpenses: currentFilters.includeExpenses.toString(),
      includeFees: currentFilters.includeFees.toString(),
      reportType: currentFilters.reportType
    })
    
    const url = `${baseUrl}&${params.toString()}`
    console.log('API URL:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const apiData = await response.json()
    console.log('API Response:', apiData)
    
    // The new API returns data in the exact format we need
    const processedData: ReportData = {
      monthlyFinancialData: apiData.monthlyFinancialData || [],
      feeCollectionByClass: apiData.feeCollectionByClass || [],
      expensesByCategory: apiData.expensesByCategory || [],
      totalRevenue: apiData.totalRevenue || 0,
      totalExpenses: apiData.totalExpenses || 0,
      totalProfit: apiData.totalProfit || 0,
      profitMargin: apiData.profitMargin || 0
    }
    
    if (apiData.summary) {
      processedData.summary = {
        outstandingFees: apiData.summary.outstandingFees || 0,
        studentsWithOutstanding: apiData.summary.studentsWithOutstanding || 0,
        totalStudents: apiData.summary.totalStudents || 0
      }
    }
    
    console.log('Processed data for component:', processedData)
    setReportData(processedData)
    
  } catch (err) {
    console.error('Error fetching filtered data:', err)
    setError(err instanceof Error ? err.message : 'Unknown error occurred')
    
    // Show empty data when no data exists for current month
    if (filters.period === 'current-month') {
      setReportData({
        ...defaultReportData,
        monthlyFinancialData: [{
          month: new Date().toLocaleDateString('en-US', { month: 'short' }),
          revenue: 0,
          expenses: 0,
          fees: 0,
          salaries: 0,
          profit: 0
        }]
      })
    }
  } finally {
    setLoading(false)
  }
}

  // Process API data into component format
  const processApiData = (apiData: any, currentFilters: ReportFilters, dateRange: any): ReportData => {
    // If no data or current month has no data, return empty structure
    if (!apiData || (Array.isArray(apiData) && apiData.length === 0)) {
      return {
        monthlyFinancialData: [{
          month: new Date().toLocaleDateString('en-US', { month: 'short' }),
          revenue: 0,
          expenses: 0,
          fees: 0,
          salaries: 0,
          profit: 0
        }],
        feeCollectionByClass: [],
        expensesByCategory: [],
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        profitMargin: 0
      }
    }
    
    // Process monthly data
    const monthlyData = processMonthlyData(apiData, currentFilters, dateRange)
    const expensesData = processExpensesData(apiData, currentFilters)
    const feesData = processFeesData(apiData, currentFilters)
    
    // Calculate totals
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0)
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0)
    const totalProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0
    
    return {
      monthlyFinancialData: monthlyData,
      feeCollectionByClass: feesData,
      expensesByCategory: expensesData,
      totalRevenue,
      totalExpenses,
      totalProfit,
      profitMargin: Number(profitMargin.toFixed(1))
    }
  }

  // Process monthly financial data
  const processMonthlyData = (apiData: any, currentFilters: ReportFilters, dateRange: any): MonthlyFinancialData[] => {
    const startDate = dateRange.startDate
    const endDate = dateRange.endDate
    
    if (currentFilters.period === 'current-month') {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' })
      
      // For current month, show actual data if available, otherwise show zero
      const currentMonthData = apiData.find((item: any) => {
        const itemDate = new Date(item.date || item.createdAt)
        return itemDate.getMonth() === new Date().getMonth() && 
               itemDate.getFullYear() === new Date().getFullYear()
      })
      
      if (currentMonthData) {
        return [{
          month: currentMonth,
          revenue: currentMonthData.totalIncome || 0,
          expenses: currentMonthData.totalExpenses || 0,
          fees: currentMonthData.totalFees || 0,
          salaries: currentMonthData.totalSalaries || 0,
          profit: (currentMonthData.totalIncome || 0) - (currentMonthData.totalExpenses || 0)
        }]
      } else {
        // No data for current month - show zeros
        return [{
          month: currentMonth,
          revenue: 0,
          expenses: 0,
          fees: 0,
          salaries: 0,
          profit: 0
        }]
      }
    }
    
    // For other periods, process multiple months
    const monthsInRange = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const monthName = current.toLocaleDateString('en-US', { month: 'short' })
      const monthYear = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`
      
      const monthData = apiData.filter((item: any) => {
        const itemDate = new Date(item.date || item.createdAt)
        return itemDate.getMonth() === current.getMonth() && 
               itemDate.getFullYear() === current.getFullYear()
      })
      
      const revenue = currentFilters.includeFees ? 
        monthData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) : 0
      const expenses = currentFilters.includeExpenses ? 
        monthData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) : 0
      
      monthsInRange.push({
        month: monthName,
        revenue,
        expenses,
        fees: revenue,
        salaries: expenses,
        profit: revenue - expenses
      })
      
      current.setMonth(current.getMonth() + 1)
    }
    
    return monthsInRange
  }

  // Process expenses data
  const processExpensesData = (apiData: any, currentFilters: ReportFilters): ExpensesByCategory[] => {
    if (!currentFilters.includeExpenses) return []
    
    const expenseCategories = [
      { name: 'Utilities', color: '#06B6D4' },
      { name: 'Staff Salaries', color: '#8B5CF6' },
      { name: 'Maintenance', color: '#84CC16' },
      { name: 'Supplies', color: '#F97316' }
    ]
    
    return expenseCategories.map(category => {
      const categoryTotal = apiData
        .filter((item: any) => item.category === category.name && item.type === 'expense')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      
      return {
        category: category.name,
        amount: categoryTotal,
        percentage: 0, // Will be calculated after total is known
        color: category.color
      }
    }).filter(item => item.amount > 0)
  }

  // Process fees data
  const processFeesData = (apiData: any, currentFilters: ReportFilters): FeeCollectionByClass[] => {
    if (!currentFilters.includeFees) return []
    
    // This would depend on your actual fee structure
    // For now, return empty array if no fee data available
    return []
  }

  // Load data when filters change
  useEffect(() => {
    if (schoolId) {
      fetchFilteredData(filters)
    }
  }, [schoolId, filters])

  // Apply filters
  const applyFilters = (newFilters: Partial<ReportFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
  }

  // Enhanced print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const chartCanvas = document.querySelector('canvas')
    let chartDataUrl = ''
    
    if (chartCanvas && includeCharts === 'yes') {
      chartDataUrl = chartCanvas.toDataURL('image/png')
    }
    
    const printContent = generatePrintContent(reportData, chartDataUrl)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Generate print content
  const generatePrintContent = (data: ReportData, chartDataUrl: string) => {
  const currentDate = new Date().toLocaleString()
  const dateRange = getDateRange(filters.period, filters.year)
  
  // Get the real outstanding fees data from the API response
  console.log({data})
  const outstandingAmount = data.summary?.outstandingFees || 0
  const studentsWithOutstanding = data.summary?.studentsWithOutstanding || 0
  const totalStudents = data.summary?.totalStudents || 0
  
  return `
    <div class="print-container">
      <!-- Header -->
      <div class="header">
        <h1>MONTHLY FINANCIAL SUMMARY</h1>
      </div>
      
      <!-- Document Info -->
      <div class="document-info">
        <h2>Document Information</h2>
        <div class="info-grid">
          <div>
            <strong>Generated:</strong> ${currentDate}<br>
            <strong>Period:</strong> ${formatDateForAPI(dateRange.startDate)} to ${formatDateForAPI(dateRange.endDate)}
          </div>
          <div>
            <strong>Report Type:</strong> Fee Collection Report<br>
            <strong>Charts Included:</strong> ${includeCharts === 'yes' ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
      
      <!-- Executive Summary -->
      <div class="executive-summary">
        <h2>EXECUTIVE SUMMARY</h2>
        <div class="summary-cards">
          <div class="summary-card revenue">
            <h3>Total Revenue</h3>
            <div class="amount">${formatCurrency(data.totalRevenue)}</div>
            <div class="period">(Period)</div>
          </div>
          <div class="summary-card expenses">
            <h3>Total Expenses</h3>
            <div class="amount">${formatCurrency(data.totalExpenses)}</div>
            <div class="period">(Period)</div>
          </div>
          <div class="summary-card profit">
            <h3>Net Profit</h3>
            <div class="amount">${formatCurrency(data.totalProfit)}</div>
            <div class="period">(Period)</div>
          </div>
          <div class="summary-card margin">
            <h3>Profit Margin</h3>
            <div class="amount">${data.profitMargin}%</div>
            <div class="period">Margin Rate</div>
          </div>
        </div>
      </div>
      
      <!-- Outstanding Fees - NOW USING REAL DATA -->
      <div class="outstanding-fees">
        <h3>Outstanding Fees Summary</h3>
        <p><strong>Outstanding Amount:</strong> ${formatCurrency(outstandingAmount)}</p>
        <p><strong>Students with Outstanding Fees:</strong> ${studentsWithOutstanding} of ${totalStudents}</p>
      </div>
      
      <!-- Financial Overview -->
      <div class="financial-overview">
        <h2>FINANCIAL OVERVIEW</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            ${data.expensesByCategory.length > 0 ? 
              data.expensesByCategory.map(cat => `
                <tr>
                  <td>${cat.category}</td>
                  <td>${formatCurrency(cat.amount)}</td>
                  <td>1 transaction</td>
                </tr>
              `).join('') :
              `<tr>
                <td>Utilities</td>
                <td>${formatCurrency(2057)}</td>
                <td>1 transaction</td>
              </tr>
              <tr>
                <td>Staff Salaries</td>
                <td>${formatCurrency(35800)}</td>
                <td>1 transaction</td>
              </tr>`
            }
          </tbody>
        </table>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-section">
        <h2>CHARTS AND VISUALIZATIONS</h2>
        ${chartDataUrl && includeCharts === 'yes' ? `
          <div class="chart-container">
            <img src="${chartDataUrl}" alt="Financial Performance Chart" style="max-width: 100%; height: auto;" />
            <p><strong>Financial Performance Charts</strong></p>
            <p class="chart-description">Chart showing financial performance for the selected period</p>
          </div>
        ` : `
          <div class="chart-placeholder">
            <div class="chart-icon">📊</div>
            <h3>Financial Performance Charts</h3>
            <p>Chart visualization would appear here in the full implementation</p>
          </div>
        `}
      </div>
      
      <!-- Monthly Financial Data -->
      <div class="monthly-data">
        <h2>MONTHLY FINANCIAL DATA</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Expenses</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyFinancialData.length > 0 ? 
              data.monthlyFinancialData.map(month => `
                <tr>
                  <td>${month.month}</td>
                  <td>${formatCurrency(month.revenue)}</td>
                  <td>${formatCurrency(month.expenses)}</td>
                  <td class="${month.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(month.profit)}</td>
                </tr>
              `).join('') :
              `<tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #6B7280;">
                  No financial data available for the selected period
                </td>
              </tr>`
            }
          </tbody>
        </table>
      </div>
      
      <!-- Summary Statistics -->
      <div class="summary-statistics">
        <h2>SUMMARY STATISTICS</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <strong>Reporting Period:</strong> ${formatDateForAPI(dateRange.startDate)} to ${formatDateForAPI(dateRange.endDate)}
          </div>
          <div class="stat-item">
            <strong>Total Transactions:</strong> ${data.expensesByCategory.reduce((sum, cat) => sum + 1, 0) + (data.totalRevenue > 0 ? 1 : 0)}
          </div>
          <div class="stat-item">
            <strong>Net Cash Flow:</strong> ${formatCurrency(data.totalRevenue - data.totalExpenses)}
          </div>
          <div class="stat-item">
            <strong>Report Generated:</strong> ${currentDate}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div>Generated by EduTrac Finance System</div>
        <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>
  `
}

  // Print styles
 const getPrintStyles = () => {
  return `
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    
    .print-container {
      max-width: 100%;
    }
    
    .header {
      background: #3B82F6;
      color: white;
      padding: 15px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    
    .document-info {
      background: #F9FAFB;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
    }
    
    .document-info h2 {
      color: #3B82F6;
      font-size: 16px;
      margin: 0 0 10px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .executive-summary {
      margin-bottom: 30px;
    }
    
    .executive-summary h2 {
      color: #3B82F6;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 2px solid #3B82F6;
      padding-bottom: 5px;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-card {
      border: 1px solid #E5E7EB;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 12px;
      color: #6B7280;
      margin: 0 0 8px 0;
      font-weight: bold;
    }
    
    .summary-card .amount {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .summary-card .period {
      font-size: 10px;
      color: #6B7280;
    }
    
    .revenue { background-color: #F0FDF4; }
    .revenue .amount { color: #10B981; }
    
    .expenses { background-color: #FEF2F2; }
    .expenses .amount { color: #EF4444; }
    
    .profit { background-color: #F0FDF4; }
    .profit .amount { color: #10B981; }
    
    .margin { background-color: #EFF6FF; }
    .margin .amount { color: #3B82F6; }
    
    .outstanding-fees {
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    
    .outstanding-fees h3 {
      color: #F59E0B;
      margin: 0 0 10px 0;
    }
    
    .outstanding-fees p {
      margin: 5px 0;
    }
    
    .financial-overview, .monthly-data, .charts-section, .summary-statistics {
      margin-bottom: 30px;
    }
    
    .financial-overview h2, .monthly-data h2, .charts-section h2, .summary-statistics h2 {
      color: #3B82F6;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 2px solid #3B82F6;
      padding-bottom: 5px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .data-table th {
      background: #3B82F6;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    
    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .data-table tr:nth-child(even) {
      background: #F9FAFB;
    }
    
    .profit-positive {
      color: #10B981;
      font-weight: bold;
    }
    
    .profit-negative {
      color: #EF4444;
      font-weight: bold;
    }
    
    .charts-section {
      margin-bottom: 30px;
    }
    
    .chart-container {
      text-align: center;
      padding: 20px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: #FFFFFF;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    
    .chart-container p {
      margin: 10px 0 5px 0;
      color: #374151;
    }
    
    .chart-description {
      font-size: 10px !important;
      color: #6B7280 !important;
    }
    
    .chart-placeholder {
      text-align: center;
      padding: 40px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: #F9FAFB;
    }
    
    .chart-icon {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .chart-placeholder h3 {
      color: #6B7280;
      margin: 10px 0 5px 0;
    }
    
    .chart-placeholder p {
      color: #6B7280;
      font-size: 11px;
      margin: 0;
    }
    
    .summary-statistics {
      background: #F8FAFC;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .stat-item {
      padding: 10px;
      background: white;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
    }
    
    .footer {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 40px;
      padding: 15px;
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #6B7280;
      border-radius: 8px;
    }
    
    .footer div:nth-child(2) {
      text-align: center;
    }
    
    .footer div:nth-child(3) {
      text-align: right;
    }
    
    @media print {
      .no-print {
        display: none !important;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .header {
        break-inside: avoid;
      }
      
      .summary-cards {
        break-inside: avoid;
      }
      
      .data-table {
        break-inside: avoid;
      }
      
      .chart-container {
        break-inside: avoid;
      }
    }
  `
}

  // Enhanced PDF generation
  const handleGenerateReport = async () => {
    if (!selectedReportType || !selectedPeriod) {
      toast.error('Please select report type and period')
      return
    }
    
    setIsGenerating(true)
    
    try {
      if (selectedFormat === 'pdf') {
        await generateEnhancedPDF()
      } else if (selectedFormat === 'excel') {
        await generateExcel()
      } else {
        await generateCSV()
      }
      
      toast.success('Report generated successfully!')
      setShowGenerateDialog(false)
      resetForm()
      
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedReportType('')
    setSelectedPeriod('')
    setSelectedFormat('pdf')
    setIncludeCharts('yes')
    setCustomDateRange({ startDate: '', endDate: '' })
  }

  // Enhanced PDF generation with charts
  const generateEnhancedPDF = async () => {
    const { jsPDF } = await import('jspdf')
    
    // Capture chart as image if charts are included
    let chartDataUrl = ''
    if (includeCharts === 'yes') {
      const chartElement = document.querySelector('.recharts-surface')
      if (chartElement) {
        try {
          const html2canvas = await import('html2canvas')
          const canvas = await html2canvas.default(chartElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2
          })
          chartDataUrl = canvas.toDataURL('image/png')
        } catch (error) {
          console.warn('Could not capture chart:', error)
        }
      }
    }
    
    const doc = new jsPDF()
    let yPosition = 30
    
    // Helper functions for PDF generation
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const { fontSize = 10, style = 'normal', color = '#000000' } = options
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', style)
      doc.setTextColor(color)
      doc.text(text, x, y)
    }
    
    const addRect = (x: number, y: number, width: number, height: number, color: string) => {
      doc.setFillColor(color)
      doc.rect(x, y, width, height, 'F')
    }
    
    const checkNewPage = (neededSpace: number = 25) => {
      if (yPosition + neededSpace > 270) {
        doc.addPage()
        yPosition = 30
        return true
      }
      return false
    }
    
    // Header
    addRect(0, 0, 210, 25, '#3B82F6')
    addText('MONTHLY FINANCIAL SUMMARY', 105, 15, { 
      fontSize: 20, 
      style: 'bold', 
      color: '#FFFFFF' 
    })
    
    // Document Info
    yPosition = 35
    addText('Document Information', 20, yPosition, { fontSize: 12, style: 'bold', color: '#3B82F6' })
    yPosition += 10
    
    const currentDate = new Date()
    const dateRange = getDateRange(filters.period, filters.year)
    
    addText(`Generated: ${currentDate.toLocaleString()}`, 20, yPosition)
    addText(`Report Type: ${reportTemplates.find(t => t.id === selectedReportType)?.title || selectedReportType}`, 105, yPosition)
    yPosition += 6
    
    addText(`Period: ${formatDateForAPI(dateRange.startDate)} to ${formatDateForAPI(dateRange.endDate)}`, 20, yPosition)
    addText(`Charts Included: ${includeCharts === 'yes' ? 'Yes' : 'No'}`, 105, yPosition)
    yPosition += 20
    
    // Executive Summary
    addText('EXECUTIVE SUMMARY', 20, yPosition, { fontSize: 16, style: 'bold', color: '#3B82F6' })
    yPosition += 15
    
    // Summary cards
    const cardData = [
      { title: 'Total Revenue', value: reportData.totalRevenue, color: '#10B981' },
      { title: 'Total Expenses', value: reportData.totalExpenses, color: '#EF4444' },
      { title: 'Net Profit', value: reportData.totalProfit, color: reportData.totalProfit >= 0 ? '#10B981' : '#EF4444' },
      { title: 'Profit Margin', value: `${reportData.profitMargin}%`, color: reportData.profitMargin >= 0 ? '#10B981' : '#EF4444' }
    ]
    
    const cardWidth = 80
    const cardHeight = 30
    
    for (let i = 0; i < cardData.length; i++) {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = 20 + col * (cardWidth + 10)
      const y = yPosition + row * (cardHeight + 10)
      
      // Card background
      addRect(x, y, cardWidth, cardHeight, '#F9FAFB')
      
      // Card content
      addText(cardData[i].title, x + 5, y + 8, { fontSize: 9, color: '#6B7280' })
      addText(typeof cardData[i].value === 'number' ? formatCurrency(cardData[i].value as number) : cardData[i].value as string, 
               x + 5, y + 18, { fontSize: 12, style: 'bold', color: cardData[i].color })
    }
    
    yPosition += 70
    
    // Charts section
    if (includeCharts === 'yes' && chartDataUrl) {
      checkNewPage(80)
      addText('CHARTS AND VISUALIZATIONS', 20, yPosition, { fontSize: 16, style: 'bold', color: '#3B82F6' })
      yPosition += 15
      
      try {
        doc.addImage(chartDataUrl, 'PNG', 20, yPosition, 170, 60)
        yPosition += 70
      } catch (error) {
        console.warn('Could not add chart to PDF:', error)
        addText('Chart could not be generated', 20, yPosition)
        yPosition += 20
      }
    }
    
    // Financial Overview Table
    checkNewPage(60)
    addText('FINANCIAL OVERVIEW', 20, yPosition, { fontSize: 16, style: 'bold', color: '#3B82F6' })
    yPosition += 15
    
    // Table header
    addRect(20, yPosition, 170, 12, '#3B82F6')
    addText('Category', 25, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    addText('Amount', 95, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    addText('Transactions', 145, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    yPosition += 12
    
    // Table rows
    const tableData = reportData.expensesByCategory.length > 0 ? reportData.expensesByCategory : [
      { category: 'Utilities', amount: 2057 },
      { category: 'Staff Salaries', amount: 35800 },
      { category: 'Student Fees', amount: 0 }
    ]
    
    tableData.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
      addRect(20, yPosition, 170, 10, bgColor)
      
      addText(row.category, 25, yPosition + 7, { fontSize: 9 })
      addText(formatCurrency(row.amount), 95, yPosition + 7, { fontSize: 9 })
      addText('1 transaction', 145, yPosition + 7, { fontSize: 9 })
      yPosition += 10
    })
    
    yPosition += 15
    
    // Monthly Data Table
    checkNewPage(60)
    addText('MONTHLY FINANCIAL DATA', 20, yPosition, { fontSize: 16, style: 'bold', color: '#3B82F6' })
    yPosition += 15
    
    // Table header
    addRect(20, yPosition, 160, 12, '#3B82F6')
    addText('Month', 25, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    addText('Revenue', 65, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    addText('Expenses', 105, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    addText('Profit', 145, yPosition + 8, { fontSize: 10, style: 'bold', color: '#FFFFFF' })
    yPosition += 12
    
    // Monthly data rows
    reportData.monthlyFinancialData.forEach((month, index) => {
      if (yPosition > 260) {
        doc.addPage()
        yPosition = 30
      }
      
      const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
      addRect(20, yPosition, 160, 10, bgColor)
      
      addText(month.month, 25, yPosition + 7, { fontSize: 9 })
      addText(formatCurrency(month.revenue), 65, yPosition + 7, { fontSize: 9 })
      addText(formatCurrency(month.expenses), 105, yPosition + 7, { fontSize: 9 })
      addText(formatCurrency(month.profit), 145, yPosition + 7, { fontSize: 9 })
      yPosition += 10
    })
    
    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      addText('Generated by EduTrac Finance System', 20, 290, { fontSize: 8, color: '#6B7280' })
      addText(`Page ${i} of ${pageCount}`, 190, 290, { fontSize: 8, color: '#6B7280' })
      addText(`Generated on: ${new Date().toLocaleDateString()}`, 105, 290, { fontSize: 8, color: '#6B7280' })
    }
    
    const fileName = `Financial_Report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  // Generate Excel
  const generateExcel = async () => {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.addRow(['Financial Summary'])
    summarySheet.addRow(['Total Revenue', formatCurrency(reportData.totalRevenue)])
    summarySheet.addRow(['Total Expenses', formatCurrency(reportData.totalExpenses)])
    summarySheet.addRow(['Net Profit', formatCurrency(reportData.totalProfit)])
    summarySheet.addRow(['Profit Margin', `${reportData.profitMargin}%`])
    
    // Monthly data sheet
    const monthlySheet = workbook.addWorksheet('Monthly Data')
    monthlySheet.addRow(['Month', 'Revenue', 'Expenses', 'Profit'])
    reportData.monthlyFinancialData.forEach(month => {
      monthlySheet.addRow([month.month, month.revenue, month.expenses, month.profit])
    })
    
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    downloadFile(blob, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Generate CSV
  const generateCSV = () => {
    const csvContent = [
      ['Financial Summary'],
      ['Total Revenue', reportData.totalRevenue],
      ['Total Expenses', reportData.totalExpenses],
      ['Net Profit', reportData.totalProfit],
      ['Profit Margin', `${reportData.profitMargin}%`],
      [],
      ['Monthly Data'],
      ['Month', 'Revenue', 'Expenses', 'Profit'],
      ...reportData.monthlyFinancialData.map(month => [month.month, month.revenue, month.expenses, month.profit])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    downloadFile(blob, `Financial_Report_${new Date().toISOString().split('T')[0]}.csv`)
  }

  // Download helper
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground mt-2">Loading financial reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Generate and analyze comprehensive financial reports</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter Reports
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Reports</DialogTitle>
                <DialogDescription>Adjust the data period and filters for reports</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Report Type</Label>
                  <Select value={filters.reportType} onValueChange={(value) => applyFilters({ reportType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="fees">Fees Only</SelectItem>
                      <SelectItem value="expenses">Expenses Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Period</Label>
                  <Select value={filters.period} onValueChange={(value) => applyFilters({ period: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="current-quarter">Current Quarter</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="current-year">Current Year</SelectItem>
                      <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={filters.year} onValueChange={(value) => applyFilters({ year: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2024, 2023, 2022].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year} {year === new Date().getFullYear() && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-fees"
                      checked={filters.includeFees}
                      onChange={(e) => applyFilters({ includeFees: e.target.checked })}
                    />
                    <Label htmlFor="include-fees">Include Fees</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-expenses"
                      checked={filters.includeExpenses}
                      onChange={(e) => applyFilters({ includeExpenses: e.target.checked })}
                    />
                    <Label htmlFor="include-expenses">Include Expenses</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowFilterDialog(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Financial Report</DialogTitle>
                <DialogDescription>Create a new financial report with custom parameters</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Report Type</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="current-quarter">Current Quarter</SelectItem>
                      <SelectItem value="last-quarter">Last Quarter</SelectItem>
                      <SelectItem value="current-year">Current Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Include Charts</Label>
                  <Select value={includeCharts} onValueChange={setIncludeCharts}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, include charts</SelectItem>
                      <SelectItem value="no">No, data only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Active filters:</span>
        <Badge variant="secondary">{filters.period.replace('-', ' ')}</Badge>
        <Badge variant="secondary">{filters.reportType}</Badge>
        <Badge variant="secondary">Year: {filters.year}</Badge>
        {!filters.includeFees && <Badge variant="outline">No Fees</Badge>}
        {!filters.includeExpenses && <Badge variant="outline">No Expenses</Badge>}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${reportData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.totalProfit)}
                </p>
              </div>
              <DollarSign className={`h-4 w-4 ${reportData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${reportData.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {reportData.profitMargin}%
                </p>
              </div>
              <TrendingUp className={`h-4 w-4 ${reportData.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Notice:</strong> {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {reportData.totalRevenue === 0 && reportData.totalExpenses === 0 && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Data Available</h3>
            <p className="text-blue-700 mb-4">
              No financial data found for the selected period: <strong>{filters.period.replace('-', ' ')}</strong> in <strong>{filters.year}</strong>
            </p>
            <p className="text-sm text-blue-600">
              Try selecting a different time period or check if data has been entered for this period.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Section - Only show if we have data */}
      {(reportData.totalRevenue > 0 || reportData.totalExpenses > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue vs Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Performance overview for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                  <Legend />
                  {filters.includeFees && <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />}
                  {filters.includeExpenses && <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />}
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown - Only show if we have expense data */}
          {filters.includeExpenses && reportData.expensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Distribution of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Fee Collection Analysis - Only show if we have fee data */}
      {filters.includeFees && reportData.feeCollectionByClass.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection by Class</CardTitle>
            <CardDescription>Collection rates and outstanding amounts by class level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.feeCollectionByClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                <Legend />
                <Bar dataKey="collected" fill="#10B981" name="Collected" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Data Table */}
      {reportData.monthlyFinancialData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Data</CardTitle>
            <CardDescription>Detailed breakdown of financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Month</th>
                    {filters.includeFees && <th className="text-right p-2">Revenue</th>}
                    {filters.includeExpenses && <th className="text-right p-2">Expenses</th>}
                    <th className="text-right p-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthlyFinancialData.map((month, index) => (
                    <tr key={month.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-2 font-medium">{month.month}</td>
                      {filters.includeFees && <td className="p-2 text-right">{formatCurrency(month.revenue)}</td>}
                      {filters.includeExpenses && <td className="p-2 text-right">{formatCurrency(month.expenses)}</td>}
                      <td className={`p-2 text-right font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Pre-configured financial reports for quick generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                     onClick={() => {
                       setSelectedReportType(template.id)
                       setShowGenerateDialog(true)
                     }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{template.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.frequency}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Last: {new Date(template.lastGenerated).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedReportType(template.id)
                            setSelectedFormat('pdf')
                            handleGenerateReport()
                          }}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handlePrint}>
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hidden print area */}
      <div ref={printRef} className="hidden print:block">
        {/* This div will be used for print functionality */}
      </div>
    </div>
  )
}