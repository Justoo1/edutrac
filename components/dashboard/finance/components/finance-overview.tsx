"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowUp, ArrowDown, DollarSign, Users, CreditCard, TrendingUp, Calendar, FileText, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Data types
interface MonthlyRevenueData {
  month: string
  revenue: number
  expenses: number
  fees: number
  salaries: number
}

interface FeeCollectionData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpenseBreakdownData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface RecentTransaction {
  type: string
  student?: string
  staff?: string
  vendor?: string
  amount: number
  status: 'completed' | 'pending'
  time: string
}

interface FinanceData {
  totalRevenue: number
  totalExpenses: number
  outstandingFees: number
  outstandingStudents: number
  pendingApprovals: number
  overduePayments: number
  salaryProcessingStatus: string
  monthlyRevenue: MonthlyRevenueData[]
  feeCollectionData: FeeCollectionData[]
  expenseBreakdown: ExpenseBreakdownData[]
  recentTransactions: RecentTransaction[]
  revenueGrowth: number
  expenseGrowth: number
  profitGrowth: number
}

// Default/fallback data (keeping the original structure)
const defaultFinanceData: FinanceData = {
  totalRevenue: 277000,
  totalExpenses: 214000,
  outstandingFees: 45300,
  outstandingStudents: 127,
  pendingApprovals: 12,
  overduePayments: 5,
  salaryProcessingStatus: 'Ready',
  revenueGrowth: 12.5,
  expenseGrowth: 3.2,
  profitGrowth: 18.7,
  monthlyRevenue: [
    { month: 'Jan', revenue: 45000, expenses: 32000, fees: 38000, salaries: 25000 },
    { month: 'Feb', revenue: 52000, expenses: 35000, fees: 45000, salaries: 26000 },
    { month: 'Mar', revenue: 48000, expenses: 33000, fees: 42000, salaries: 25500 },
    { month: 'Apr', revenue: 61000, expenses: 38000, fees: 51000, salaries: 27000 },
    { month: 'May', revenue: 55000, expenses: 36000, fees: 48000, salaries: 26500 },
    { month: 'Jun', revenue: 67000, expenses: 40000, fees: 58000, salaries: 28000 },
  ],
  feeCollectionData: [
    { category: 'Tuition Fees', amount: 180000, percentage: 65, color: '#3B82F6' },
    { category: 'Activity Fees', amount: 45000, percentage: 16, color: '#10B981' },
    { category: 'Laboratory Fees', amount: 35000, percentage: 13, color: '#F59E0B' },
    { category: 'Transport Fees', amount: 17000, percentage: 6, color: '#EF4444' },
  ],
  expenseBreakdown: [
    { category: 'Staff Salaries', amount: 165000, percentage: 60, color: '#8B5CF6' },
    { category: 'Utilities', amount: 27500, percentage: 10, color: '#06B6D4' },
    { category: 'Maintenance', amount: 22000, percentage: 8, color: '#84CC16' },
    { category: 'Supplies', amount: 19250, percentage: 7, color: '#F97316' },
    { category: 'Other', amount: 41250, percentage: 15, color: '#6B7280' },
  ],
  recentTransactions: [
    { type: 'Fee Payment', student: 'Kwame Asante', amount: 1500, status: 'completed', time: '2 minutes ago' },
    { type: 'Salary Payment', staff: 'Mrs. Adjoa Mensah', amount: 3200, status: 'pending', time: '1 hour ago' },
    { type: 'Utility Bill', vendor: 'ECG Ghana', amount: 2800, status: 'completed', time: '3 hours ago' },
    { type: 'Fee Payment', student: 'Ama Osei', amount: 1200, status: 'completed', time: '5 hours ago' },
    { type: 'Supply Purchase', vendor: 'Stationery Plus', amount: 850, status: 'completed', time: '1 day ago' },
  ]
}

interface FinanceOverviewProps {
  schoolId?: string
}

export function FinanceOverview({ schoolId = "test-school" }: FinanceOverviewProps) {
  const [financeData, setFinanceData] = useState<FinanceData>(defaultFinanceData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch finance data from API
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/finance/overview?schoolId=${schoolId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch finance data: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API Response:', data)
        
        // API now returns properly structured data, so we can use it directly
        setFinanceData(data)
      } catch (err) {
        console.error('Error fetching finance data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        // Keep using default data on error
        setFinanceData(defaultFinanceData)
      } finally {
        setLoading(false)
      }
    }

    if (schoolId) {
      fetchFinanceData()
    }
  }, [schoolId])

  // Calculate derived values
  const totalRevenue = financeData.totalRevenue
  const totalExpenses = financeData.totalExpenses
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1)

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground mt-2">Loading finance data...</p>
        </div>
      </div>
    )
  }

  // Show error state (but continue with default data)
  if (error) {
    console.warn('Using default data due to API error:', error)
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {financeData.revenueGrowth >= 0 ? (
                <ArrowUp className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={financeData.revenueGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>
                {financeData.revenueGrowth >= 0 ? '+' : ''}{financeData.revenueGrowth}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalExpenses.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {financeData.expenseGrowth >= 0 ? (
                <ArrowUp className="mr-1 h-3 w-3 text-red-500" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3 text-emerald-500" />
              )}
              <span className={financeData.expenseGrowth >= 0 ? "text-red-500" : "text-emerald-500"}>
                {financeData.expenseGrowth >= 0 ? '+' : ''}{financeData.expenseGrowth}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">GH₵{netProfit.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {financeData.profitGrowth >= 0 ? (
                <ArrowUp className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={financeData.profitGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>
                {financeData.profitGrowth >= 0 ? '+' : ''}{financeData.profitGrowth}%
              </span>
              <span className="ml-1">profit margin: {profitMargin}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">GH₵{financeData.outstandingFees.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-amber-500">{financeData.outstandingStudents} students</span>
              <span className="ml-1">pending payment</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Expenses Trend</CardTitle>
            <CardDescription>Monthly comparison of revenue vs expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financeData.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Breakdown</CardTitle>
            <CardDescription>Distribution of fee collections by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financeData.feeCollectionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {financeData.feeCollectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expense Breakdown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Expense Breakdown</CardTitle>
            <CardDescription>Detailed view of expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeData.expenseBreakdown} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value) => [`GH₵${value.toLocaleString()}`, '']} />
                <Bar dataKey="amount" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used finance operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Process Salaries
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Payment Reminders
            </Button>
            
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Approvals</span>
                  <Badge variant="secondary">{financeData.pendingApprovals}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overdue Payments</span>
                  <Badge variant="destructive">{financeData.overduePayments}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Salary Processing</span>
                  <Badge variant="default">{financeData.salaryProcessingStatus}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
          <CardDescription>Latest transactions and financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financeData.recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.student || transaction.staff || transaction.vendor} • {transaction.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">GH₵{transaction.amount.toLocaleString()}</p>
                  <Badge variant={transaction.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Using cached data. {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
