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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";

const academicYearSchema = z.object({
  name: z.string().min(4, "Academic year must be at least 4 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  current: z.boolean(),
});

type AcademicYearFormValues = {
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

interface AcademicYearSetupProps {
  schoolId: string;
}

export function AcademicYearSetup({ schoolId }: AcademicYearSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [editingYearId, setEditingYearId] = useState<string | null>(null);

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      current: true,
    },
  });

  // Fetch academic years on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schools/${schoolId}/academic/years`);
        if (response.ok) {
          const data = await response.json();
          setAcademicYears(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load academic years");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [schoolId]);

  async function onSubmit(data: AcademicYearFormValues) {
    setIsSubmitting(true);

    try {
      const formattedData = {
        ...data,
        isCurrent: true,
      };

      const url = `/api/schools/${schoolId}/academic/years`;
      const method = editingYearId ? "PUT" : "POST";
      const body = editingYearId 
        ? { ...formattedData, id: editingYearId }
        : formattedData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to process academic year");
      }

      const updatedYear = await response.json();
      
      if (editingYearId) {
        setAcademicYears(academicYears.map(year => year.id === editingYearId ? updatedYear : year));
      } else {
        setAcademicYears([...academicYears, updatedYear]);
      }

      form.reset();
      setEditingYearId(null);
      toast.success(`Academic year ${editingYearId ? "updated" : "created"} successfully!`);
    } catch (error) {
      toast.error("Failed to process academic year");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEdit = (year: any) => {
    setEditingYearId(year.id);
    form.reset({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      current: year.isCurrent,
    });
  };

  const handleDelete = async (yearId: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/academic/years?id=${yearId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete academic year");
      }

      setAcademicYears(academicYears.filter((year) => year.id !== yearId));
      toast.success("Academic year deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete academic year");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Academic Years
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Years</CardTitle>
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
          <CardTitle>{editingYearId ? "Edit Academic Year" : "Create New Academic Year"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2023-2024" {...field} />
                    </FormControl>
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
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
                      {editingYearId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingYearId ? "Update Academic Year" : "Create Academic Year"
                  )}
                </Button>
                {editingYearId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setEditingYearId(null);
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
          <CardTitle>Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>{year.name}</TableCell>
                  <TableCell>{new Date(year.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(year.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{year.isCurrent ? "Current" : "Past"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(year)}
                          className="flex items-center"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(year.id)}
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