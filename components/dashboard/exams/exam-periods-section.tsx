"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicTerm {
  id: string;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: string;
  isCurrent: boolean;
}

interface ExamPeriod {
  id: number;
  schoolId: string;
  name: string;
  academicYearId: string;
  academicTermId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ExamPeriodsSectionProps {
  schoolId: string;
  showButton?: boolean;
}

export default function ExamPeriodsSection({ schoolId, showButton = true }: ExamPeriodsSectionProps) {
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ExamPeriod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    academicYearId: "",
    academicTermId: "",
    startDate: new Date(),
    endDate: new Date(),
  });

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/academic/years`);
      if (!response.ok) throw new Error("Failed to fetch academic years");
      const data = await response.json();
      setAcademicYears(data);
    } catch (error) {
      toast.error("Failed to fetch academic years");
    }
  };

  const fetchAcademicTerms = async (yearId: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/academic/terms?yearId=${yearId}`);
      if (!response.ok) throw new Error("Failed to fetch academic terms");
      const data = await response.json();
      setAcademicTerms(data);
    } catch (error) {
      toast.error("Failed to fetch academic terms");
    }
  };

  const fetchPeriods = async () => {
    try {
      const response = await fetch(`/api/exam-period?schoolId=${schoolId}`);
      if (!response.ok) throw new Error("Failed to fetch exam periods");
      const data = await response.json();
      setPeriods(data);
    } catch (error) {
      toast.error("Failed to fetch exam periods");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.academicYearId) {
      fetchAcademicTerms(formData.academicYearId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.academicYearId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/exam-period", {
        method: editingPeriod ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          schoolId,
          id: editingPeriod?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save exam period");

      toast.success(
        editingPeriod
          ? "Exam period updated successfully"
          : "Exam period created successfully"
      );
      setIsDialogOpen(false);
      fetchPeriods();
    } catch (error) {
      toast.error("Failed to save exam period");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this exam period?")) return;

    try {
      const response = await fetch(`/api/exam-period/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete exam period");

      toast.success("Exam period deleted successfully");
      fetchPeriods();
    } catch (error) {
      toast.error("Failed to delete exam period");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Periods</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {showButton && (
           <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPeriod(null);
                setFormData({
                  name: "",
                  academicYearId: "",
                  academicTermId: "",
                  startDate: new Date(),
                  endDate: new Date(),
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Period
            </Button>
          </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPeriod ? "Edit Exam Period" : "Add Exam Period"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Period Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., First Term 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, academicYearId: value, academicTermId: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Term</Label>
                <Select
                  value={formData.academicTermId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, academicTermId: value })
                  }
                  disabled={!formData.academicYearId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic term" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, startDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, endDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPeriod ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No exam periods found
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => {
              const year = academicYears.find(y => y.id === period.academicYearId);
              const term = academicTerms.find(t => t.id === period.academicTermId);
              return (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{period.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {year?.name} - {term?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(period.startDate), "PPP")} -{" "}
                      {format(new Date(period.endDate), "PPP")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPeriod(period);
                        setFormData({
                          name: period.name,
                          academicYearId: period.academicYearId,
                          academicTermId: period.academicTermId,
                          startDate: new Date(period.startDate),
                          endDate: new Date(period.endDate),
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(period.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 