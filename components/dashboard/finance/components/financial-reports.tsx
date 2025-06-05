"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FileText, Download, TrendingUp, DollarSign, Users, BarChart3, PieChart as PieChartIcon, Filter, Printer } from "lucide-react"

// Mock data for reports
const monthlyFinancialData = [
  { month: 'Jan', revenue: 245000, expenses: 185000, fees: 220000, salaries: 165000, profit: 60000 },
  { month: 'Feb', revenue: 258000, expenses: 195000, fees: 235000, salaries: 172000, profit: 63000 },
  { month: 'Mar', revenue: 267000, expenses: 201000, fees: 248000, salaries: 175000, profit: 66000 },
  { month: 'Apr', revenue: 275000, expenses: 210000, fees: 252000, salaries: 180000, profit: 65000 },
  { month: 'May', revenue: 285000, expenses: 218000, fees: 265000, salaries: 185000, profit: 67000 },
  { month: 'Jun', revenue: 295000, expenses: 225000, fees: 275000, salaries: 190000, profit: 70000 }
]

const feeCollectionByClass = [
  { class: 'JHS 1', collected: 112500, pending: 12500, total: 125000, percentage: 90 },
  { class: 'JHS 2', collected: 108000, pending: 15000, total: 123000, percentage: 88 },
  { class: 'JHS 3', collected: 105000, pending: 18000, total: 123000, percentage: 85 },
  { class: 'SHS 1', collected: 195000, pending: 25000, total: 220000, percentage: 89 },
  { class: 'SHS 2', collected: 185000, pending: 35000, total: 220000, percentage: 84 },
  { class: 'SHS 3', collected: 175000, pending: 45000, total: 220000, percentage: 80 }
]

const expensesByCategory = [
  { category: 'Staff Salaries', amount: 1050000, percentage: 60, color: '#8B5CF6' },
  { category: 'Utilities', amount: 175000, percentage: 10, color: '#06B6D4' },
  { category: 'Maintenance', amount: 140000, percentage: 8, color: '#84CC16' },
  { category: 'Supplies', amount: 122500, percentage: 7, color: '#F97316' },
  { category: 'Transport', amount: 105000, percentage: 6, color: '#EF4444' },
  { category: 'Other', amount: 157500, percentage: 9, color: '#6B7280' }
]

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

export function FinancialReports() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  const totalRevenue = monthlyFinancialData.reduce((sum, data) => sum + data.revenue, 0)
  const totalExpenses = monthlyFinancialData.reduce((sum, data) => sum + data.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Generate and analyze comprehensive financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter Reports
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
                  <Select>
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
                  <Select>
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
                <div>
                  <Label>Format</Label>
                  <Select defaultValue="pdf">
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
                  <Select defaultValue="yes">
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
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowGenerateDialog(false)}>
                  Generate Report
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
                <p className="text-2xl font-bold">GH₵{totalRevenue.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">GH₵{totalExpenses.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-green-600">GH₵{totalProfit.toLocaleString()}</p>
              </div>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">{profitMargin}%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              <LineChart data={monthlyFinancialData}>
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
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expensesByCategory.map((entry, index) => (
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
            <BarChart data={feeCollectionByClass}>
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
