import { getSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinanceOverview } from "@/components/dashboard/finance/components/finance-overview"
import { StudentFeesManagement } from "@/components/dashboard/finance/components/student-fees-management"
import { StaffSalaryManagement } from "@/components/dashboard/finance/components/staff-salary-management"
import { ExpenseManagement } from "@/components/dashboard/finance/components/expense-management"
import { FinancialReports } from "@/components/dashboard/finance/components/financial-reports"
import { FeeStructureManagement } from "@/components/dashboard/finance/components/fee-structure-management"
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const session = await getSession();
  if(!session) (
    redirect("/login")
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="student-fees">Student Fees</TabsTrigger>
          <TabsTrigger value="staff-salary">Staff Salary</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="fee-structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinanceOverview schoolId={session?.user.schoolId} />
        </TabsContent>

        <TabsContent value="student-fees" className="space-y-6">
          <StudentFeesManagement />
        </TabsContent>

        <TabsContent value="staff-salary" className="space-y-6">
          <StaffSalaryManagement />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseManagement schoolId={session?.user.schoolId} />
        </TabsContent>

        <TabsContent value="fee-structure" className="space-y-6">
          <FeeStructureManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinancialReports schoolId={session?.user.schoolId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
