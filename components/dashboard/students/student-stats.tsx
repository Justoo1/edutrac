import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, FileText } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, description, icon, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Total Students"
        value="124,684"
        description="Current enrollment"
        icon={<Users className="h-6 w-6 text-white" />}
        iconBg="bg-blue-500"
      />
      <StatCard
        title="Attendance Rate"
        value="95.7%"
        description="School average"
        icon={<GraduationCap className="h-6 w-6 text-white" />}
        iconBg="bg-green-500"
      />
      <StatCard
        title="Avg. Performance"
        value="B+"
        description="Overall grade average"
        icon={<FileText className="h-6 w-6 text-white" />}
        iconBg="bg-amber-500"
      />
    </div>
  );
}