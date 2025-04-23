"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GuardianForm } from "@/components/form/guardian-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GuardianEditFormProps {
  guardianId: string;
  schoolId: string;
  initialData: any;
}

export default function GuardianEditForm({ guardianId, schoolId, initialData }: GuardianEditFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/guadians/${guardianId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete guardian: ${response.status}`);
      }
      
      toast.success("Guardian deleted successfully");
      router.push("/guardian");
      router.refresh();
    } catch (error) {
      console.error("Error deleting guardian:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push("/guardian")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guardians
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Guardian
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the guardian
                and remove their association with all students.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Card className="p-6">
        <GuardianForm 
          initialData={initialData} 
          schoolId={schoolId} 
        />
      </Card>
    </div>
  );
} 