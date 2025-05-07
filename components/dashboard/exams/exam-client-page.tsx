// app/app/(dashboard)/exams/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Settings,
  FileText,
  BookOpen,
  BarChart,
  Clock,
  CheckCircle,
  ListChecks,
  Calendar,
} from "lucide-react";
import ExamPeriodsSection from "@/components/dashboard/exams/exam-periods-section";
import ExamTypesSection from "@/components/dashboard/exams/exam-types-section";
import ExamConfigurationSection from "@/components/dashboard/exams/exam-configuration-section";
import ExamSection from "./exam-section";
import { toast } from "sonner"
import LoadingDots from "@/components/icons/loading-dots";

interface ExamClientPageProps {
  schoolId: string;
}

export default function ExamClientPage({ schoolId }: ExamClientPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("recent");
  const [examStats, setExamStats] = useState({
    total: 0,
    upcoming: 0,
    inProgress: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExamStats = async () => {
      try {
        // This would be replaced with actual API call to get stats
        const response = await fetch("api/exams/stats")
        if(!response.ok){
          throw new Error("Could not fetch exams Page stats")
        }
        const data = await response.json()
        setExamStats(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching exam stats:", error);
        setIsLoading(false);
      }
    };

    fetchExamStats();
  }, []);

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Examinations</h1>
            <p className="text-gray-600">Manage all your school examinations in one place</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white" onClick={() => router.push("/exams/configuration")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </Button>
            <Button onClick={() => router.push("/exams/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Exams</p>
                <h3 className="text-3xl font-bold">{isLoading ? <LoadingDots /> : examStats.total}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <h3 className="text-3xl font-bold">{isLoading ? <LoadingDots /> : examStats.upcoming}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <h3 className="text-3xl font-bold">{isLoading ? <LoadingDots /> : examStats.inProgress}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <h3 className="text-3xl font-bold">{isLoading ? <LoadingDots /> : examStats.completed}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search exams..." 
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Select>
              <SelectTrigger className="bg-white w-[180px]">
                <SelectValue placeholder="Academic Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">First Term</SelectItem>
                <SelectItem value="term2">Second Term</SelectItem>
                <SelectItem value="term3">Third Term</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-white w-[180px]">
                <SelectValue placeholder="Grade Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jhs1">JHS 1</SelectItem>
                <SelectItem value="jhs2">JHS 2</SelectItem>
                <SelectItem value="jhs3">JHS 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start pb-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none"
            >
              All Exams
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none"
            >
              Ongoing
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none"
            >
              Archived
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="text-center py-10">Loading exams...</div>
            ) : examStats.total === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No exams found</p>
                <Button onClick={() => router.push("/exams/new")}>Create Your First Exam</Button>
              </div>
            ) : (
              <ExamSection schoolId={schoolId} tableTitle="All Exams" />
            )}
          </TabsContent>
          {/* Other tab contents would be similar */}
          <TabsContent value="upcoming">
            <ExamSection schoolId={schoolId} upcoming={true} tableTitle="Upcoming Exams"/>
          </TabsContent>
          <TabsContent value="ongoing">Ongoing exams content</TabsContent>
          <TabsContent value="completed">Completed exams content</TabsContent>
          <TabsContent value="archived">Archived exams content</TabsContent>
        </Tabs>
      </div>

      {/* Reports and Management Tabs */}
      <Tabs defaultValue="recent" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          {/* <TabsTrigger value="recent">Recent Exams</TabsTrigger> */}
          <TabsTrigger value="periods">Exam Periods</TabsTrigger>
          <TabsTrigger value="types">Exam Types</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {/* <TabsContent value="recent" className="mt-6">
          <div className="text-center py-4">
            <p className="text-gray-500">Recent exams will appear here</p>
          </div>
        </TabsContent> */}
        
        <TabsContent value="periods" className="mt-6">
          {schoolId && (
            <ExamPeriodsSection schoolId={schoolId} showButton={false} />
          )}
        </TabsContent>
        
        <TabsContent value="types" className="mt-6">
          <ExamTypesSection schoolId={schoolId!} showButton={false} />
        </TabsContent>
        
        <TabsContent value="configuration" className="mt-6">
          <ExamConfigurationSection schoolId={schoolId!} showButton={false} />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-blue-500">
                    <FileText size={24} />
                  </div>
                  <div className="text-gray-500">Academic</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Term Reports</h3>
                <p className="text-gray-600 mb-4">Generate and manage end of term reports</p>
                <Button variant="outline" className="w-full" onClick={() => router.push("/exams/report/generate")}>
                    View Reports
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-green-500">
                    <BookOpen size={24} />
                  </div>
                  <div className="text-gray-500">Academic</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Transcripts</h3>
                <p className="text-gray-600 mb-4">Generate comprehensive academic transcripts</p>
                <Button variant="outline" className="w-full">
                  View Transcripts
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-purple-500">
                    <BarChart size={24} />
                  </div>
                  <div className="text-gray-500">Analytics</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Performance Analysis</h3>
                <p className="text-gray-600 mb-4">Analyze student performance across terms</p>
                <Button variant="outline" className="w-full">
                  View Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}