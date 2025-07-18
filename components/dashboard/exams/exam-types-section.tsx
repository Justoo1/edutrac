"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";

interface ExamType {
  id: string;
  name: string;
  description: string;
  weight: number;
  isSystem: boolean;
}

interface ExamTypesSectionProps {
  schoolId: string;
  showButton?: boolean;
}

export default function ExamTypesSection({ schoolId, showButton = true }: ExamTypesSectionProps) {
  const [types, setTypes] = useState<ExamType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExamType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    weight: 0,
  });

  useEffect(() => {
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/exam-types", {
        method: editingType ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          schoolId,
          id: editingType?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to save exam type");

      toast.success(
        editingType
          ? "Exam type updated successfully"
          : "Exam type created successfully"
      );
      setIsDialogOpen(false);
      fetchTypes();
    } catch (error) {
      toast.error("Failed to save exam type");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam type?")) return;

    try {
      const response = await fetch(`/api/exam-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete exam type");

      toast.success("Exam type deleted successfully");
      fetchTypes();
    } catch (error) {
      toast.error("Failed to delete exam type");
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch(`/api/exam-types?schoolId=${schoolId}`);
      if (!response.ok) throw new Error("Failed to fetch exam types");
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching exam types:", error);
      toast.error("Failed to fetch exam types");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Types</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {showButton && (
            <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingType(null);
                setFormData({
                  name: "",
                  description: "",
                  weight: 0,
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Exam Type" : "Add Exam Type"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Type Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Mid-Term Exam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the exam type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  placeholder="Weight in percentage"
                />
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
                  {editingType ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : types.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No exam types found
          </div>
        ) : (
          <div className="space-y-4">
            {types.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Weight: {type.weight}%
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!type.isSystem && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType(type);
                          setFormData({
                            name: type.name,
                            description: type.description,
                            weight: type.weight,
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 