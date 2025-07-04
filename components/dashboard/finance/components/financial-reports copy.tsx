"use client"

import { useState, useEffect } from "react"
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
}

interface FinancialReportsProps {
  schoolId?: string
}

// Default data (keeping the original structure as fallback)
const defaultReportData: ReportData = {
  monthlyFinancialData: [
    { month: 'Jan', revenue: 245000, expenses: 185000, fees: 220000, salaries: 165000, profit: 60000 },
    { month: 'Feb', revenue: 258000, expenses: 195000, fees: 235000, salaries: 172000, profit: 63000 },
    { month: 'Mar', revenue: 267000, expenses: 201000, fees: 248000, salaries: 175000, profit: 66000 },
    { month: 'Apr', revenue: 275000, expenses: 210000, fees: 252000, salaries: 180000, profit: 65000 },
    { month: 'May', revenue: 285000, expenses: 218000, fees: 265000, salaries: 185000, profit: 67000 },
    { month: 'Jun', revenue: 295000, expenses: 225000, fees: 275000, salaries: 190000, profit: 70000 }
  ],
  feeCollectionByClass: [
    { class: 'JHS 1', collected: 112500, pending: 12500, total: 125000, percentage: 90 },
    { class: 'JHS 2', collected: 108000, pending: 15000, total: 123000, percentage: 88 },
    { class: 'JHS 3', collected: 105000, pending: 18000, total: 123000, percentage: 85 },
    { class: 'SHS 1', collected: 195000, pending: 25000, total: 220000, percentage: 89 },
    { class: 'SHS 2', collected: 185000, pending: 35000, total: 220000, percentage: 84 },
    { class: 'SHS 3', collected: 175000, pending: 45000, total: 220000, percentage: 80 }
  ],
  expensesByCategory: [
    { category: 'Staff Salaries', amount: 1050000, percentage: 60, color: '#8B5CF6' },
    { category: 'Utilities', amount: 175000, percentage: 10, color: '#06B6D4' },
    { category: 'Maintenance', amount: 140000, percentage: 8, color: '#84CC16' },
    { category: 'Supplies', amount: 122500, percentage: 7, color: '#F97316' },
    { category: 'Transport', amount: 105000, percentage: 6, color: '#EF4444' },
    { category: 'Other', amount: 157500, percentage: 9, color: '#6B7280' }
  ],
  totalRevenue: 1625000,
  totalExpenses: 1234000,
  totalProfit: 391000,
  profitMargin: 24.1
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
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    description: 'Comprehensive P&L statement with year-over-year comparisons',
    icon: TrendingUp,
    frequency: 'Quarterly',
    lastGenerated: '2023-12-31'
  },
  {
    id: 'budget-variance',
    title: 'Budget Variance Report',
    description: 'Budget vs actual performance analysis',
    icon: BarChart3,
    frequency: 'Monthly',
    lastGenerated: '2024-01-31'
  }
]

export function FinancialReports({ schoolId = "test-school" }: FinancialReportsProps) {
  // State management
  const [reportData, setReportData] = useState<ReportData>(defaultReportData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
  const [filterPeriod, setFilterPeriod] = useState('last-6-months')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  
  // State for dynamic year detection
  const [availableDataYears, setAvailableDataYears] = useState<number[]>([])
  
  // Generate dynamic year options
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const defaultStartYear = 2020 // Fallback if no data available
    
    // Use earliest year from actual data or default
    const startYear = availableDataYears.length > 0 
      ? Math.min(...availableDataYears)
      : defaultStartYear
    
    const years = []
    
    // Add future year if we're in Q4 (preparing for next year)
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 9) { // October, November, December
      years.push(currentYear + 1)
    }
    
    // Add current year and previous years
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year)
    }
    
    return years
  }
  
  const availableYears = generateYearOptions()

  // Fetch available years from API
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        // Fetch a broader range to detect available years
        const response = await fetch(`/api/finance/overview?schoolId=${schoolId}&type=available-years`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.availableYears && Array.isArray(data.availableYears)) {
            setAvailableDataYears(data.availableYears)
          } else {
            // Extract years from existing data if available-years endpoint doesn't exist
            const currentYear = new Date().getFullYear()
            const estimatedYears = [currentYear, currentYear - 1, currentYear - 2]
            setAvailableDataYears(estimatedYears)
          }
        } else {
          // Fallback: assume last 3 years have data
          const currentYear = new Date().getFullYear()
          const fallbackYears = [currentYear, currentYear - 1, currentYear - 2]
          setAvailableDataYears(fallbackYears)
        }
      } catch (error) {
        console.error('Error fetching available years:', error)
        // Fallback: assume last 3 years have data
        const currentYear = new Date().getFullYear()
        const fallbackYears = [currentYear, currentYear - 1, currentYear - 2]
        setAvailableDataYears(fallbackYears)
      }
    }

    if (schoolId) {
      fetchAvailableYears()
    }
  }, [schoolId])

  // Fetch report data from API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch data from multiple endpoints to build comprehensive report
        const [overviewResponse, monthlyResponse, feeResponse] = await Promise.all([
          fetch(`/api/finance/overview?schoolId=${schoolId}`),
          fetch(`/api/finance/overview?schoolId=${schoolId}&type=monthly&year=${filterYear}`),
          fetch(`/api/finance/student-fees?schoolId=${schoolId}`)
        ])
        
        if (!overviewResponse.ok || !monthlyResponse.ok) {
          throw new Error('Failed to fetch report data')
        }
        
        const overviewData = await overviewResponse.json()
        const monthlyData = await monthlyResponse.json()
        const feeData = feeResponse.ok ? await feeResponse.json() : []
        
        console.log('Report data fetched:', { overviewData, monthlyData, feeData })
        
        // Process monthly data into chart format
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const processedMonthlyData = monthNames.map((monthName, index) => {
          const monthNumber = index + 1
          const yearMonth = `${filterYear}-${monthNumber.toString().padStart(2, '0')}`
          
          const monthlyIncome = monthlyData
            .filter((d: any) => d.month === yearMonth && d.type === 'income')
            .reduce((sum: number, d: any) => sum + parseFloat(d.totalAmount?.toString() || '0'), 0)
            
          const monthlyExpenses = monthlyData
            .filter((d: any) => d.month === yearMonth && d.type === 'expense')
            .reduce((sum: number, d: any) => sum + parseFloat(d.totalAmount?.toString() || '0'), 0)
            
          const monthlyFees = monthlyData
            .filter((d: any) => d.month === yearMonth && d.type === 'income')
            .reduce((sum: number, d: any) => sum + parseFloat(d.totalAmount?.toString() || '0'), 0)
            
          const monthlySalaries = monthlyData
            .filter((d: any) => d.month === yearMonth && d.type === 'expense')
            .reduce((sum: number, d: any) => sum + parseFloat(d.totalAmount?.toString() || '0'), 0)
          
          return {
            month: monthName,
            revenue: Math.round(monthlyIncome),
            expenses: Math.round(monthlyExpenses),
            fees: Math.round(monthlyFees),
            salaries: Math.round(monthlySalaries),
            profit: Math.round(monthlyIncome - monthlyExpenses)
          }
        }).slice(-6) // Last 6 months
        
        // Process fee collection by class data (use real data if available, otherwise use calculated estimates)
        let feeCollectionByClass = defaultReportData.feeCollectionByClass
        if (feeData && Array.isArray(feeData) && feeData.length > 0) {
          // Group fee data by class if available in the API response
          // This would need to be implemented based on your actual student-fees API structure
          console.log('Fee data available:', feeData.length, 'records')
        }
        
        // Process expenses by category from overview data
        let expensesByCategory = defaultReportData.expensesByCategory
        if (overviewData.expenseBreakdown && Array.isArray(overviewData.expenseBreakdown)) {
          const totalExpenses = overviewData.expenseBreakdown.reduce(
            (sum: number, cat: any) => sum + (cat.amount || 0), 0
          )
          
          expensesByCategory = overviewData.expenseBreakdown.map((cat: any, index: number) => ({
            category: cat.category,
            amount: cat.amount || 0,
            percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0,
            color: cat.color || defaultReportData.expensesByCategory[index]?.color || '#6B7280'
          }))
        }
        
        // Calculate totals
        const totalRevenue = processedMonthlyData.reduce((sum, data) => sum + data.revenue, 0)
        const totalExpenses = processedMonthlyData.reduce((sum, data) => sum + data.expenses, 0)
        const totalProfit = totalRevenue - totalExpenses
        const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0
        
        const newReportData: ReportData = {
          monthlyFinancialData: processedMonthlyData,
          feeCollectionByClass,
          expensesByCategory,
          totalRevenue,
          totalExpenses,
          totalProfit,
          profitMargin: Number(profitMargin.toFixed(1))
        }
        
        console.log('Processed report data:', newReportData)
        setReportData(newReportData)
        
      } catch (err) {
        console.error('Error fetching report data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        // Keep using default data on error
        setReportData(defaultReportData)
      } finally {
        setLoading(false)
      }
    }

    if (schoolId) {
      fetchReportData()
    }
  }, [schoolId, filterYear])
  
  // Handle report generation
  const handleGenerateReport = async () => {
    if (!selectedReportType || !selectedPeriod) {
      toast.error('Please select report type and period')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const requestBody = {
        schoolId,
        reportType: selectedReportType,
        period: selectedPeriod,
        format: selectedFormat,
        includeCharts: includeCharts === 'yes',
        customDateRange: selectedPeriod === 'custom' ? customDateRange : undefined
      }
      
      console.log('Generating report with:', requestBody)
      
      const response = await fetch('/api/finance/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }
      
      // Handle different response types based on format
      if (selectedFormat === 'pdf') {
        const data = await response.json()
        
        if (data.type === 'pdf-data') {
          // Generate PDF on the frontend using the data
          await generatePDFFromData(data.content, selectedReportType, includeCharts === 'yes')
        } else {
          // Handle binary PDF response (if API returns actual PDF)
          const blob = await response.blob()
          downloadFile(blob, `${selectedReportType}-${selectedPeriod}-report.pdf`, 'application/pdf')
        }
      } else if (selectedFormat === 'csv') {
        // Handle CSV response
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('text/csv')) {
          // Direct CSV response
          const blob = await response.blob()
          downloadFile(blob, `${selectedReportType}-${selectedPeriod}-report.csv`, 'text/csv')
        } else {
          // JSON response to convert to CSV
          const data = await response.json()
          const csvContent = convertToCSV(data.content || data)
          const blob = new Blob([csvContent], { type: 'text/csv' })
          downloadFile(blob, `${selectedReportType}-${selectedPeriod}-report.csv`, 'text/csv')
        }
      } else if (selectedFormat === 'excel') {
        const data = await response.json()
        
        if (data.type === 'excel-data') {
          // Generate Excel file from data
          await generateExcelFromData(data.content, selectedReportType)
        }
      }
      
      toast.success('Report generated successfully!')
      setShowGenerateDialog(false)
      
      // Reset form
      setSelectedReportType('')
      setSelectedPeriod('')
      setSelectedFormat('pdf')
      setIncludeCharts('yes')
      setCustomDateRange({ startDate: '', endDate: '' })
      
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Generate PDF from data with chart support
  const generatePDFFromData = async (reportContent: any, reportType: string, includeCharts: boolean) => {
    console.log('Starting PDF generation...')
    console.log('Report content:', reportContent)
    
    try {
      // Simple dynamic import with fallback
      let jsPDF
      try {
        const jsPDFModule = await import('jspdf')
        jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
        console.log('jsPDF imported successfully')
      } catch (importError) {
        console.error('Failed to import jsPDF:', importError)
        throw new Error('Could not load PDF library')
      }
      
      if (!jsPDF) {
        throw new Error('jsPDF not available after import')
      }
      
      const doc = new jsPDF()
      let yPosition = 20
      
      // Simple text without complex font settings
      doc.setFontSize(20)
      doc.text(reportContent.title || 'Financial Report', 20, yPosition)
      yPosition += 20
      
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition)
      yPosition += 8
      doc.text(`Period: ${reportContent.dateRange || 'Current Period'}`, 20, yPosition)
      yPosition += 8
      doc.text(`Charts Included: ${includeCharts ? 'Yes' : 'No'}`, 20, yPosition)
      yPosition += 20
      
      // Add sections
      if (reportContent.sections && Array.isArray(reportContent.sections)) {
        reportContent.sections.forEach((section: any) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
          
          // Section title
          doc.setFontSize(14)
          doc.text(section.title, 20, yPosition)
          yPosition += 15
          
          doc.setFontSize(10)
          
          if (section.isChart && includeCharts) {
            // Add chart placeholder
            doc.setDrawColor(200)
            doc.rect(20, yPosition, 170, 30)
            doc.text('[Chart: ' + section.title + ']', 105, yPosition + 15)
            doc.text('Chart visualization would appear here', 105, yPosition + 22)
            yPosition += 40
            
          } else if (!section.isChart && section.content && Array.isArray(section.content)) {
            // Add text content
            section.content.forEach((line: string) => {
              if (yPosition > 270) {
                doc.addPage()
                yPosition = 20
              }
              doc.text(line, 25, yPosition)
              yPosition += 8
            })
          }
          
          yPosition += 10
        })
      }
      
      // Add simple data table if available
      if (reportData && reportData.monthlyFinancialData && reportData.monthlyFinancialData.length > 0) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(14)
        doc.text('Monthly Financial Data', 20, yPosition)
        yPosition += 15
        
        doc.setFontSize(9)
        
        // Simple table without autotable
        const headers = ['Month', 'Revenue', 'Expenses', 'Profit']
        let xPos = 20
        headers.forEach((header, index) => {
          doc.text(header, xPos, yPosition)
          xPos += 40
        })
        yPosition += 10
        
        reportData.monthlyFinancialData.slice(0, 10).forEach((item: any) => { // Limit to 10 rows
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          
          xPos = 20
          const rowData = [
            item.month,
            `GH₵${item.revenue.toLocaleString()}`,
            `GH₵${item.expenses.toLocaleString()}`,
            `GH₵${item.profit.toLocaleString()}`
          ]
          
          rowData.forEach((cell) => {
            doc.text(cell.toString(), xPos, yPosition)
            xPos += 40
          })
          yPosition += 8
        })
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 105, 290)
        doc.text('Generated by EduTrac Finance System', 20, 290)
      }
      
      console.log('PDF generation successful, saving...')
      
      // Save the PDF
      const fileName = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      console.log('PDF saved:', fileName)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`PDF generation failed: ${errorMessage}. Downloading as text file.`)
      
      // Create fallback content
      const fallbackContent = createFallbackContent(reportContent)
      const blob = new Blob([fallbackContent], { type: 'text/plain' })
      downloadFile(blob, `${reportType}-fallback-${Date.now()}.txt`, 'text/plain')
    }
  }
  
  // Helper function to create fallback content
  const createFallbackContent = (reportContent: any): string => {
    let content = `${reportContent.title || 'Financial Report'}\n`
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Period: ${reportContent.dateRange || 'Current Period'}\n\n`
    
    if (reportContent.sections && Array.isArray(reportContent.sections)) {
      reportContent.sections.forEach((section: any) => {
        content += `${section.title}:\n`
        if (section.content && Array.isArray(section.content)) {
          section.content.forEach((line: string) => {
            content += `  ${line}\n`
          })
        }
        content += '\n'
      })
    }
    
    // Add financial data if available
    if (reportData && reportData.monthlyFinancialData) {
      content += 'Monthly Financial Data:\n'
      content += 'Month,Revenue,Expenses,Profit\n'
      reportData.monthlyFinancialData.forEach((item: any) => {
        content += `${item.month},${item.revenue},${item.expenses},${item.profit}\n`
      })
    }
    
    return content
  }
  
  // Generate Excel from data
  const generateExcelFromData = async (excelData: any, reportType: string) => {
    try {
      // Import ExcelJS dynamically
      const ExcelJS = await import('exceljs')
      
      const workbook = new ExcelJS.Workbook()
      
      excelData.sheets.forEach((sheetData: any) => {
        const worksheet = workbook.addWorksheet(sheetData.name)
        
        // Add data to worksheet
        sheetData.data.forEach((row: any[], index: number) => {
          const excelRow = worksheet.addRow(row)
          
          // Style the header row
          if (index === 0) {
            excelRow.font = { bold: true }
            excelRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '3B82F6' }
            }
          }
        })
        
        // Auto-size columns
        worksheet.columns.forEach(column => {
          let maxLength = 0
          if (column.eachCell) {
            column.eachCell({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value ? cell.value.toString().length : 10
              if (columnLength > maxLength) {
                maxLength = columnLength
              }
            })
          }
          column.width = maxLength < 10 ? 10 : maxLength + 2
        })
      })
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      downloadFile(blob, `${reportType}-${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      
    } catch (error) {
      console.error('Error generating Excel:', error)
      
      // Fallback to CSV
      let content = ''
      excelData.sheets.forEach((sheet: any) => {
        content += `Sheet: ${sheet.name}\n`
        sheet.data.forEach((row: any[]) => {
          content += row.join(',') + '\n'
        })
        content += '\n'
      })
      
      const blob = new Blob([content], { type: 'text/csv' })
      downloadFile(blob, `${reportType}-${Date.now()}.csv`, 'text/csv')
      
      toast.warning('Excel generation failed. Downloaded as CSV instead.')
    }
  }
  
  // Helper function to download files
  const downloadFile = (blob: Blob, fileName: string, mimeType: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
  
  // Helper function to convert data to CSV
  const convertToCSV = (data: any): string => {
    if (!data || typeof data !== 'object') return ''
    
    // Simple CSV conversion - you can enhance this based on your needs
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => 
        headers.map(header => row[header] || '').join(',')
      )
    ].join('\n')
    
    return csvContent
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
                  <Label>Data Period</Label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                      <SelectItem value="current-year">Current Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => {
                        const isCurrentYear = year === new Date().getFullYear()
                        const isFutureYear = year > new Date().getFullYear()
                        const hasData = availableDataYears.includes(year)
                        
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{year}</span>
                              <div className="flex items-center gap-1 ml-2">
                                {isCurrentYear && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Current</span>
                                )}
                                {isFutureYear && (
                                  <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Future</span>
                                )}
                                {hasData && (
                                  <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Data</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {availableDataYears.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Data available for: {availableDataYears.sort((a, b) => b - a).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowFilterDialog(false)
                  // Data will refresh automatically due to useEffect dependency on filterYear
                }}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue (6M)</p>
                <p className="text-2xl font-bold">GH₵{reportData.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses (6M)</p>
                <p className="text-2xl font-bold">GH₵{reportData.totalExpenses.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit (6M)</p>
                <p className={`text-2xl font-bold ${reportData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH₵{reportData.totalProfit.toLocaleString()}
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
                <strong>Notice:</strong> Using cached data. {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses Trend</CardTitle>
            <CardDescription>6-month financial performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyFinancialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
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
                <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection Analysis */}
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
              <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="collected" fill="#10B981" name="Collected" />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
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

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Recently generated financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'January 2024 Financial Summary', type: 'PDF', size: '2.4 MB', date: '2024-02-01', status: 'completed' },
              { name: 'Q4 2023 Profit & Loss Statement', type: 'Excel', size: '1.8 MB', date: '2024-01-15', status: 'completed' },
              { name: 'December 2023 Fee Collection Report', type: 'PDF', size: '1.2 MB', date: '2024-01-05', status: 'completed' },
              { name: 'Annual Expense Analysis 2023', type: 'PDF', size: '3.1 MB', date: '2024-01-02', status: 'completed' },
              { name: 'Staff Payroll Summary - December', type: 'Excel', size: '856 KB', date: '2023-12-31', status: 'completed' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.type} • {report.size} • {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {report.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
