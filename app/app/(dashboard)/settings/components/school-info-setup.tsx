"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateSchool } from "@/lib/actions";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const schoolInfoSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  description: z.string().optional(),
  schoolCode: z.string().min(2, "School code is required"),
  schoolType: z.enum(["PRIMARY", "JHS", "SHS", "BASIC"]),
  region: z.string().min(2, "Region is required"),
  district: z.string().min(2, "District is required"),
  address: z.string().min(2, "Address is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  establishedYear: z.coerce.number().min(1900, "Please enter a valid year").max(new Date().getFullYear(), "Year cannot be in the future"),
});

type SchoolInfoValues = z.infer<typeof schoolInfoSchema>;

interface SchoolInfoSetupProps {
  schoolId: string;
}

export function SchoolInfoSetup({ schoolId }: SchoolInfoSetupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);

  const form = useForm<SchoolInfoValues>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: "",
      description: "",
      schoolCode: "",
      schoolType: "BASIC",
      region: "",
      district: "",
      address: "",
      phone: "",
      email: "",
      establishedYear: new Date().getFullYear(),
    },
  });

  // Fetch school details on component mount
  useEffect(() => {
    async function fetchSchoolData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schools/${schoolId}`);
        if (response.ok) {
          const schoolData = await response.json();
          setSchool(schoolData);
          
          // Populate form with existing data
          form.reset({
            name: schoolData.name || "",
            description: schoolData.description || "",
            schoolCode: schoolData.schoolCode || "",
            schoolType: schoolData.schoolType || "BASIC",
            region: schoolData.region || "",
            district: schoolData.district || "",
            address: schoolData.address || "",
            phone: schoolData.phone || "",
            email: schoolData.email || "",
            establishedYear: schoolData.establishedYear || new Date().getFullYear(),
          });
        }
      } catch (error) {
        console.error("Failed to fetch school data:", error);
        toast.error("Failed to load school information");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchoolData();
  }, [schoolId, form]);

  async function onSubmit(data: SchoolInfoValues) {
    setIsSubmitting(true);

    try {
      // For each field, create a separate update request
      const fields = Object.keys(data) as (keyof SchoolInfoValues)[];
      
      for (const field of fields) {
        // Skip schoolType to ensure it's never updated
        if (field === 'schoolType') continue;
        
        if (school[field] !== data[field]) {
          const formData = new FormData();
          formData.append(field.toString(), data[field]?.toString() || "");
          
          const result = await updateSchool(formData, school, field.toString());
          
          if ('error' in result) {
            throw new Error(result.error);
          }
        }
      }

      toast.success("School information updated successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update school information");
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
              Loading School Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schoolCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schoolType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Type</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled 
                        />
                      </FormControl>
                      <FormDescription>
                        School type cannot be changed after creation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="establishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Established</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1900}
                          max={new Date().getFullYear()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of your school"
                        className="resize-none"
                        {...field}
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 