"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

// Form schema with Zod
const schoolRegistrationSchema = z
  .object({
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
        "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number."
      ),
    adminEmail: z.string().email("Please enter a valid email address"),
    adminPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    adminConfirmPassword: z.string(),
    adminFirstName: z
      .string()
      .min(2, "First name must be at least 2 characters"),
    adminLastName: z.string().min(2, "Last name must be at least 2 characters"),
    schoolType: z.enum(["PRIMARY", "JHS", "SHS", "BASIC"]).default("BASIC"),
    plan: z.enum(["BASIC", "STANDARD", "PREMIUM"]).default("BASIC"),
  })
  .refine((data) => data.adminPassword === data.adminConfirmPassword, {
    message: "Passwords do not match",
    path: ["adminConfirmPassword"],
  });

// Types
type RegistrationFormValues = z.infer<typeof schoolRegistrationSchema>;

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
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Add default values for required fields
          schoolType: "BASIC",
          plan: "BASIC",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create school");
      }

      toast.success("School created successfully!");
      router.push("/dashboard/setup"); // Redirect to complete setup
    } catch (error) {
      toast.error("Failed to create school");
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

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? "Creating..." : "Create School"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
