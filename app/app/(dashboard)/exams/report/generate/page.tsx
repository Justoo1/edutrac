import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import GenerateTerminalReportsPage from "@/components/dashboard/exams/generate-report"

const ReportGenerat = async () => {
    const session = await getSession()
    if(!session?.user){
        redirect("/login")
    }
  return (
    <GenerateTerminalReportsPage schoolId={session.user.schoolId}/>
  )
}

export default ReportGenerat