"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { createSchool } from "@/lib/actions";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

// Form schema with Zod
const quickSetupSchema = z.object({
  name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name cannot exceed 100 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain cannot exceed 63 characters")
    .regex(
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    ),
  schoolType: z.enum(["PRIMARY", "JHS", "SHS", "BASIC"]).default("BASIC"),
});

export default function QuickSchoolSetup() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);

  const form = useForm<z.infer<typeof quickSetupSchema>>({
    resolver: zodResolver(quickSetupSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      schoolType: "BASIC",
    },
    mode: "onChange",
  });

  // Check subdomain availability
  const checkSubdomainAvailability = async () => {
    if (!form.getValues("subdomain") || form.getValues("subdomain").length < 3) return;

    setIsCheckingSubdomain(true);
    setSubdomainAvailable(null);

    try {
      const response = await fetch(
        `/api/schools/check-subdomain?subdomain=${form.getValues("subdomain")}`
      );
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  async function onSubmit(data: z.infer<typeof quickSetupSchema>) {
    setIsSubmitting(true);

    try {
      // Create FormData for the server action
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("subdomain", data.subdomain);
      formData.append("schoolType", data.schoolType);
      formData.append("plan", "BASIC");
      
      // Call the createSchool server action
      const result = await createSchool(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("School created successfully!");
      router.push("/settings"); // Redirect to complete setup
    } catch (error: any) {
      toast.error(error.message || "Failed to create school");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create your school</h1>
          <p className="text-muted-foreground mt-2">
            Get started by creating your school on EduTrac.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Amazing School" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        placeholder="my-school"
                        {...field}
                        className="rounded-r-none"
                        onChange={(e) => {
                          field.onChange(e);
                          setSubdomainAvailable(null);
                        }}
                        onBlur={() => checkSubdomainAvailability()}
                      />
                      <span className="px-3 py-2 bg-muted border border-l-0 rounded-r-md">
                        .edutrac.com
                      </span>
                    </div>
                  </FormControl>
                  <div className="mt-1 flex items-center">
                    {isCheckingSubdomain ? (
                      <div className="text-xs text-blue-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Checking
                        availability...
                      </div>
                    ) : subdomainAvailable === true ? (
                      <div className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Subdomain is
                        available
                      </div>
                    ) : subdomainAvailable === false ? (
                      <div className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Subdomain is
                        already taken
                      </div>
                    ) : null}
                  </div>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic School (K-JHS)</SelectItem>
                      <SelectItem value="PRIMARY">Primary School Only</SelectItem>
                      <SelectItem value="JHS">Junior High School Only</SelectItem>
                      <SelectItem value="SHS">Senior High School</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines which grade levels will be available in your school.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid || subdomainAvailable === false}
            >
              {isSubmitting ? "Creating..." : "Create School"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
