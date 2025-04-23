"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { useSession } from "next-auth/react";
interface ExamPeriod {
  id: number;
  name: string;
  academicYear: string;
  term: string;
  startDate: string;
  endDate: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Class {
  id: string;
  name: string;
  level: string;
}

interface ExamType {
  id: string;
  name: string;
  code: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
}

export default function CreateExamPage() {
    const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [formData, setFormData] = useState({
    examCode: "",
    name: "",
    description: "",
    examPeriodId: "",
    subjectId: "",
    classId: "",
    staffId: "",
    examTypeId: "",
    totalMarks: 100,
    passingMarks: 40,
    duration: 120, // in minutes
    date: new Date(),
    startTime: "09:00",
    endTime: "11:00",
  });

  if(!session){
    redirect("/login");
  }

  if(!session.user.schoolId && session.user.role === "admin"){
    redirect("/schools");
  }
  if(!session.user.schoolId && session.user.role !== "admin"){
    return <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl font-bold">Your School is not set, Ask your Admin to set it</h1>
    </div>
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const [periodsResponse, subjectsResponse, classesResponse, examTypesResponse, staffResponse] = await Promise.all([
          fetch(`/api/exam-period?schoolId=${session?.user.schoolId}`),
          fetch(`/api/subjects?schoolId=${session?.user.schoolId}`),
          fetch(`/api/classes?schoolId=${session?.user.schoolId}`),
          fetch(`/api/exam-types?schoolId=${session?.user.schoolId}`),
          fetch(`/api/teachers?schoolId=${session?.user.schoolId}`)
        ]);

        if (!periodsResponse.ok) throw new Error("Failed to fetch exam periods");
        const periodsData = await periodsResponse.json();
        setExamPeriods(Array.isArray(periodsData) ? periodsData : []);

        if (!subjectsResponse.ok) throw new Error("Failed to fetch subjects");
        const subjectsData = await subjectsResponse.json();
        setSubjects(Array.isArray(subjectsData.subjects) ? subjectsData.subjects : []);

        if (!classesResponse.ok) throw new Error("Failed to fetch classes");
        const classesData = await classesResponse.json();
        setClasses(Array.isArray(classesData) ? classesData : []);

        if (!examTypesResponse.ok) throw new Error("Failed to fetch exam types");
        const examTypesData = await examTypesResponse.json();
        setExamTypes(Array.isArray(examTypesData) ? examTypesData : []);

        if (!staffResponse.ok) throw new Error("Failed to fetch staff");
        const staffData = await staffResponse.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsDataLoading(false);
      }
    };

    if (session?.user.schoolId) {
      fetchData();
    }
  }, [session?.user.schoolId]);

  const handleStaffChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      staffId: value
    }));
  };

  // Function to auto-generate exam name
  const generateExamName = (subjectId: string, examTypeId: string, classId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const examType = examTypes.find(t => t.id === examTypeId);
    const class_ = classes.find(c => c.id === classId);
    
    if (subject && examType && class_) {
      return `${subject.name} ${examType.name} ${class_.name}`;
    }
    return "";
  };

  const generateExamCode = (subjectId: string, examTypeId: string, classId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const examType = examTypes.find(t => t.id === examTypeId);
    const class_ = classes.find(c => c.id === classId);
    
    if (subject && examType && class_) {    
      return `${subject.code}-${examType.id.slice(0, 3)}-${class_.id.slice(0, 3)}`;
    }
    return "";
  };

  // Update form data and auto-generate name when subject or exam type changes
  const handleSubjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subjectId: value,
      name: generateExamName(value, prev.examTypeId, prev.classId),
      examCode: generateExamCode(value, prev.examTypeId, prev.classId)
    }));
  };

  const handleExamTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      examTypeId: value,
      name: generateExamName(prev.subjectId, value, prev.classId),
      examCode: generateExamCode(prev.subjectId, value, prev.classId)
    }));
  };

  const handleClassChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      classId: value,
      name: generateExamName(prev.subjectId, prev.examTypeId, value),
      examCode: generateExamCode(prev.subjectId, prev.examTypeId, value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to create exam");
      }

      toast.success("Exam created successfully");
      router.push("/exams");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create exam");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>
           <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeftIcon className="w-4 h-4" /> Back</Button>
                <h1 className="text-2xl font-bold">Create New Exam</h1>
           </div>
          </CardTitle>
          <CardDescription>
            Create a new exam for your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="examCode">Exam Code</Label>
                    <Input
                    id="examCode"
                    value={formData.examCode}
                    onChange={(e) =>
                        setFormData({ ...formData, examCode: e.target.value })
                    }
                    placeholder="Exam code will be auto-generated"
                    required
                    />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Responsible Staff</Label>
                <Select
                  value={formData.staffId}
                  onValueChange={handleStaffChange}
                  disabled={isDataLoading}
                  required
                >   
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading staff..." : "Select staff"} />
                    </SelectTrigger>
                  <SelectContent>
                    {isDataLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : staff.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No staff found
                      </div>
                    ) : (
                      staff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Exam name will be auto-generated"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={handleSubjectChange}
                  disabled={isDataLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading subjects..." : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isDataLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : subjects.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No subjects found
                      </div>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examTypeId">Exam Type</Label>
                <Select
                  value={formData.examTypeId}
                  onValueChange={handleExamTypeChange}
                  disabled={isDataLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading exam types..." : "Select exam type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isDataLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : examTypes.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No exam types found
                      </div>
                    ) : (
                      examTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={handleClassChange}
                  disabled={isDataLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading classes..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isDataLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : classes.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No classes found
                      </div>
                    ) : (
                      classes.map((class_) => (
                        <SelectItem key={class_.id} value={class_.id}>
                          {class_.name} ({class_.level})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examPeriodId">Exam Period</Label>
                <Select
                  value={formData.examPeriodId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, examPeriodId: value })
                  }
                  disabled={isDataLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading periods..." : "Select exam period"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isDataLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : examPeriods.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No exam periods found
                      </div>
                    ) : (
                      examPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id.toString()}>
                          {period.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalMarks: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passingMarks: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  max={formData.totalMarks}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Exam Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: new Date(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter exam description and instructions"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Exam
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}