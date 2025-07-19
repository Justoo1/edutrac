"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectAcademicYear } from "@/lib/schema";

const termSchema = z.object({
  name: z.string().min(1, "Term name is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().default(false),
});

type TermFormValues = {
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

interface TermSetupProps {
  schoolId: string;
}

export function TermSetup({ schoolId }: TermSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [terms, setTerms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: "",
      academicYearId: "",
      startDate: "",
      endDate: "",
      isCurrent: true,
    },
  });

  // Fetch academic years and terms on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const yearsResponse = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (yearsResponse.ok) {
          const yearsData = await yearsResponse.json();
          setAcademicYears(yearsData);
          
          // Set default academic year to current one after data is loaded
          const currentYear = yearsData.find((year:SelectAcademicYear) => year.isCurrent);
          if (currentYear) {
            form.setValue("academicYearId", currentYear.id);
            form.setValue("startDate", currentYear.startDate);
            form.setValue("endDate", currentYear.endDate);
          }
        }

        const termsResponse = await fetch(`/api/schools/${schoolId}/academic/terms`);
        if (termsResponse.ok) {
          const termsData = await termsResponse.json();
          setTerms(termsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load terms data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [schoolId, form]);

  // Update dates when academic year changes
  const selectedYearId = form.watch("academicYearId");
  useEffect(() => {
    if (selectedYearId) {
      const selectedYear = academicYears.find(year => year.id === selectedYearId);
      if (selectedYear) {
        // Format dates to YYYY-MM-DD for the date input
        const startDate = new Date(selectedYear.startDate).toISOString().split('T')[0];
        const endDate = new Date(selectedYear.endDate).toISOString().split('T')[0];
        
        form.setValue("startDate", startDate);
        form.setValue("endDate", endDate);
      }
    }
  }, [selectedYearId, academicYears, form]);

  async function onSubmit(data: TermFormValues) {
    setIsSubmitting(true);

    try {
      // Extract term number from name (e.g., "Term 2" -> 2)
      const termNumberMatch = data.name.match(/\d+/);
      const termNumber = termNumberMatch ? parseInt(termNumberMatch[0]) : 1;

      // Get the selected academic year
      const selectedYear = academicYears.find(year => year.id === data.academicYearId);
      if (!selectedYear) {
        throw new Error("Selected academic year not found");
      }

      const yearStart = new Date(selectedYear.startDate);
      const yearEnd = new Date(selectedYear.endDate);

      // Check for duplicate term numbers in the same academic year (excluding the current term if editing)
      const existingTerms = terms.filter(term => 
        term.academicYearId === data.academicYearId && 
        term.id !== editingTermId
      );
      const duplicateTerm = existingTerms.find(term => {
        const termNumberMatch = term.name.match(/\d+/);
        const existingTermNumber = termNumberMatch ? parseInt(termNumberMatch[0]) : 1;
        return existingTermNumber === termNumber;
      });

      if (duplicateTerm) {
        throw new Error(`Term ${termNumber} already exists in this academic year. Please use a different term number.`);
      }

      const formattedData = {
        ...data,
        termNumber,
        startDate: yearStart.toISOString(),
        endDate: yearEnd.toISOString(),
        isCurrent: selectedYear.isCurrent,
      };

      const url = `/api/schools/${schoolId}/academic/terms`;
      const method = editingTermId ? "PUT" : "POST";
      const body = editingTermId 
        ? { ...formattedData, id: editingTermId }
        : formattedData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process term");
      }

      const updatedTerm = await response.json();
      
      if (editingTermId) {
        setTerms(terms.map(term => term.id === editingTermId ? updatedTerm : term));
      } else {
        setTerms([...terms, updatedTerm]);
      }

      form.reset();
      setEditingTermId(null);
      toast.success(`Term ${editingTermId ? "updated" : "created"} successfully!`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to process term. Please check your input and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEdit = (term: any) => {
    setEditingTermId(term.id);
    form.reset({
      name: term.name,
      academicYearId: term.academicYearId,
      startDate: term.startDate,
      endDate: term.endDate,
      isCurrent: term.isCurrent,
    });
  };

  const handleDelete = async (termId: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/academic/terms?id=${termId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete term");
      }

      setTerms(terms.filter((term) => term.id !== termId));
      toast.success("Term deleted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete term");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingTermId ? "Edit Term" : "Create New Term"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., First Term" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTermId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTermId ? "Update Term" : "Create Term"
                  )}
                </Button>
                {editingTermId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setEditingTermId(null);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>{term.name}</TableCell>
                  <TableCell>
                    {academicYears.find((year) => year.id === term.academicYearId)?.name}
                  </TableCell>
                  <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{term.isCurrent ? "Current" : "Past"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(term)}
                          className="flex items-center"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(term.id)}
                          className="flex items-center text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 