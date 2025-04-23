"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Interface matching the schema (snake_case)
interface ExamConfiguration {
  id: number;
  school_id: string;
  class_score_weight: number;
  exam_score_weight: number;
  pass_mark?: number | null;
  highest_mark?: number | null;
  use_grade_system?: boolean | null;
  created_at: string;
  updated_at: string;
}

// Zod schema for general settings form validation
const generalSettingsFormSchema = z.object({
  pass_mark: z
    .number({
      required_error: "Pass mark is required.",
      invalid_type_error: "Pass mark must be a number.",
    })
    .min(0, "Pass mark cannot be negative.")
    .max(100, "Pass mark cannot exceed 100."),
  highest_mark: z
    .number({
      required_error: "Highest mark is required.",
      invalid_type_error: "Highest mark must be a number.",
    })
    .min(1, "Highest mark must be at least 1."),
  use_grade_system: z.boolean().default(true),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsFormSchema>;

interface GeneralSettingsSectionProps {
  schoolId: string;
}

export default function GeneralSettingsSection({ schoolId }: GeneralSettingsSectionProps) {
  const [config, setConfig] = useState<ExamConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsFormSchema),
    defaultValues: {
      pass_mark: 50,
      highest_mark: 100,
      use_grade_system: true,
    },
  });

  useEffect(() => {
    fetchConfiguration();
  }, [schoolId]);

  const fetchConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/exam-configurations?schoolId=${schoolId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch exam configuration");
      }
      const data: ExamConfiguration = await response.json();
      setConfig(data);
      // Update form defaults once data is fetched
      form.reset({
        pass_mark: data.pass_mark ?? 50,
        highest_mark: data.highest_mark ?? 100,
        use_grade_system: data.use_grade_system ?? true,
      });
    } catch (error) {
      console.error("Error fetching exam configuration:", error);
      toast.error((error as Error).message || "Failed to fetch exam configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: GeneralSettingsFormValues) => {
    if (!config) {
      toast.error("Configuration not loaded yet.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        schoolId: schoolId,
        // Include existing weights to avoid resetting them
        class_score_weight: config.class_score_weight,
        exam_score_weight: config.exam_score_weight,
        // Add the general settings being updated
        ...data,
      };

      const response = await fetch("/api/exam-configurations", {
        method: "POST", // API uses POST for upsert
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update general settings");
      }

      toast.success("General settings updated successfully");
      fetchConfiguration(); // Refresh data to show updated values
    } catch (error) {
      toast.error((error as Error).message || "Failed to update general settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>General Exam Settings</CardTitle>
          <CardDescription>
            Configure basic exam parameters like pass marks and grading system usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
     return (
      <Card>
        <CardHeader>
          <CardTitle>General Exam Settings</CardTitle>
        </CardHeader>
         <CardContent className="text-center py-4 text-muted-foreground">
           Could not load exam configuration.
         </CardContent>
      </Card>
     );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>General Exam Settings</CardTitle>
            <CardDescription>
              Configure basic exam parameters like pass marks and grading system usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="pass_mark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass Mark (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g., 50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The minimum percentage required to pass an exam/subject.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="highest_mark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Possible Mark</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g., 100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The maximum mark achievable in assessments.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="use_grade_system"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Use Grading System</FormLabel>
                    <FormDescription>
                      Enable to assign letter grades (e.g., A1, B2) based on scores.
                      Disable to only use raw scores.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true} // Default to true if null/undefined
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 