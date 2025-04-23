"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import CreateSubjectForm from './create-subject-form'

interface CreateSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolType: 'SHS' | 'Basic';
  schoolId: string;
  onSuccess?: () => void;
}

export function CreateSubjectModal({ 
  open, 
  onOpenChange, 
  schoolType,
  schoolId,
  onSuccess
}: CreateSubjectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Create a new subject for your school curriculum
          </DialogDescription>
        </DialogHeader>
        <CreateSubjectForm 
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onOpenChange(false);
          }}
          schoolType={schoolType}
          schoolId={schoolId} 
        />
      </DialogContent>
    </Dialog>
  )
}

export default CreateSubjectModal 