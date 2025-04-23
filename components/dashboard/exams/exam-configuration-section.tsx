"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface matching the schema (snake_case)
interface ExamConfiguration {
  id: number; // Changed from string
  school_id: string;
  class_score_weight: number;
  exam_score_weight: number; // Renamed from endOfTermWeight
  pass_mark?: number | null; // Added optional fields from schema
  highest_mark?: number | null;
  use_grade_system?: boolean | null;
  created_at: string; // Assuming API returns ISO string
  updated_at: string; // Assuming API returns ISO string
}

interface ExamConfigurationSectionProps {
  schoolId: string; // Keep camelCase for prop consistency
  showButton?: boolean;
}

export default function ExamConfigurationSection({ schoolId, showButton = true }: ExamConfigurationSectionProps) {
  const [config, setConfig] = useState<ExamConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    class_score_weight: 0,
    exam_score_weight: 0,
  });

  useEffect(() => {
    fetchConfiguration();
  }, [schoolId]);

  const fetchConfiguration = async () => {
    setIsLoading(true); // Set loading true at the start
    try {
      const response = await fetch(`/api/exam-configurations?schoolId=${schoolId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch exam configuration");
      }
      const data: ExamConfiguration = await response.json();
      setConfig(data);
      setFormData({
        class_score_weight: data.class_score_weight,
        exam_score_weight: data.exam_score_weight,
      });
    } catch (error) {
      console.error("Error fetching exam configuration:", error);
      toast.error((error as Error).message || "Failed to fetch exam configuration");
      // Optionally set default state or clear config on error
      // setConfig(null);
      // setFormData({ class_score_weight: 0, exam_score_weight: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (
    value: number,
    field: "class_score_weight" | "exam_score_weight"
  ) => {
    const otherField = field === "class_score_weight" ? "exam_score_weight" : "class_score_weight";
    const clampedValue = Math.max(0, Math.min(100, value)); // Ensure value is between 0 and 100
    
    // Construct the new state object explicitly
    const newState = {
      class_score_weight: 0, // Initialize with defaults
      exam_score_weight: 0,
    };
    newState[field] = clampedValue;
    newState[otherField] = 100 - clampedValue;

    setFormData(newState); // Pass the correctly typed object
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.class_score_weight + formData.exam_score_weight !== 100) {
      toast.error("Weights must sum to 100%");
      return;
    }
    try {
      const response = await fetch("/api/exam-configurations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send snake_case to match API expectation (which should align with schema)
        body: JSON.stringify({
          schoolId: schoolId, // API might expect camelCase here if not fixed yet
          class_score_weight: formData.class_score_weight,
          exam_score_weight: formData.exam_score_weight,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update exam configuration");
      }

      toast.success("Exam configuration updated successfully");
      setIsDialogOpen(false);
      fetchConfiguration(); // Refresh data
    } catch (error) {
      toast.error((error as Error).message || "Failed to update exam configuration");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Weight Configuration</CardTitle> {/* Updated Title */}
        {config && ( // Only show button if config loaded
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Weights
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Exam Weights</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classScoreWeight">Class Score Weight (%)</Label>
                  <Input
                    id="classScoreWeight"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.class_score_weight}
                    onChange={(e) =>
                      handleWeightChange(Number(e.target.value), "class_score_weight")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examScoreWeight">End of Term Weight (%)</Label>
                  <Input
                    id="examScoreWeight"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.exam_score_weight}
                    onChange={(e) =>
                      handleWeightChange(Number(e.target.value), "exam_score_weight")
                    }
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Total must be 100%.
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading Configuration...</div>
        ) : config ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Class Score Weight</h3>
                <p className="text-2xl font-bold">{config.class_score_weight}%</p>
                <p className="text-sm text-muted-foreground">
                  Combined weight of all regular assessments (tests, assignments, etc.)
                </p>
              </div>
              <div>
                <h3 className="font-medium">End of Term Weight</h3>
                <p className="text-2xl font-bold">{config.exam_score_weight}%</p>
                <p className="text-sm text-muted-foreground">
                  Weight of the final term examination
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground border-t pt-4 mt-4">
              <p>
                Note: The total weight must equal 100%. These percentages determine how scores are combined for the final term report.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Exam configuration could not be loaded.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 