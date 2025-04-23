"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuardianForm } from "@/components/form/guardian-form";

interface CreateGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  schoolId: string;
}

export function CreateGuardianModal({
  isOpen,
  onClose,
  onCreated,
  schoolId,
}: CreateGuardianModalProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Guardian</DialogTitle>
          <DialogDescription>
            Add a new guardian for students in your school. Fill out the 
            guardian information and select which students they&apos;re associated with.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <GuardianForm 
            schoolId={schoolId} 
            initialData={{
              emergencyContact: true,
              createAccount: true,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 