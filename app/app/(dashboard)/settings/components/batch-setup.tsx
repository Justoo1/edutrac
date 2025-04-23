"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

type BatchFormValues = z.infer<typeof batchSchema>;

interface BatchSetupProps {
  schoolId: string;
}

export function BatchSetup({ schoolId }: BatchSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [schoolType, setSchoolType] = useState<string | null>(null);

  // Define all possible grade levels
  const basicSchoolGradeLevels = [
    "Kindergarten 1",
    "Kindergarten 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JHS 1",
    "JHS 2",
    "JHS 3",
  ];

  const highSchoolGradeLevels = [
    "SHS 1",
    "SHS 2",
    "SHS 3"
  ];

  // Get grade levels based on school type
  const getGradeLevels = () => {
    if (schoolType?.toLowerCase().includes('high') || 
        schoolType?.toLowerCase().includes('shs') ||
        schoolType?.toLowerCase().includes('secondary')) {
      return highSchoolGradeLevels;
    }
    return basicSchoolGradeLevels;
  };

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      gradeLevel: "",
      capacity: 30,
      academicYearId: "",
    },
  });

  // Watch for grade level changes to update the name
  const selectedGradeLevel = form.watch("gradeLevel");
  useEffect(() => {
    if (selectedGradeLevel) {
      form.setValue("name", selectedGradeLevel);
    }
  }, [selectedGradeLevel, form]);

  // Fetch school details, batches, and academic years on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch school details to get school type
        const schoolResponse = await fetch(`/api/schools/${schoolId}`);
        if (schoolResponse.ok) {
          const schoolData = await schoolResponse.json();
          setSchoolType(schoolData.schoolType);
        }

        // Fetch batches
        const batchesResponse = await fetch(`/api/schools/${schoolId}/batches`);
        if (batchesResponse.ok) {
          const batchesData = await batchesResponse.json();
          setBatches(batchesData);
        }

        // Fetch academic years
        const yearsResponse = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (yearsResponse.ok) {
          const yearsData = await yearsResponse.json();
          setAcademicYears(yearsData);
          
          // Set default academic year to current one
          const currentYear = yearsData.find((year: any) => year.isCurrent);
          if (currentYear) {
            form.setValue("academicYearId", currentYear.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load batch data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [schoolId, form]);

  async function onSubmit(data: BatchFormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/schools/${schoolId}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create batch");
      }

      const newBatch = await response.json();
      setBatches([...batches, newBatch]);
      form.reset({
        name: "",
        gradeLevel: "",
        capacity: 30,
        academicYearId: data.academicYearId, // Keep the selected academic year
      });
      toast.success("Batch created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create batch");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Batches
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
            <CardTitle>Batches</CardTitle>
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
          <CardTitle>Create New Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getGradeLevels().map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Batch"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Academic Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.name}</TableCell>
                  <TableCell>{batch.gradeLevel}</TableCell>
                  <TableCell>{batch.capacity}</TableCell>
                  <TableCell>
                    {academicYears.find((year) => year.id === batch.academicYearId)?.name || "N/A"}
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