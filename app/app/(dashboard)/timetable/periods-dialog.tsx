'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Period {
  id?: string
  schoolId: string
  time: string
  label: string
  type: 'class' | 'break'
  orderIndex: number
}

interface PeriodsDialogProps {
  isOpen: boolean
  onClose: () => void
  period?: Period
  schoolId: string
  onSuccess: () => void
}

// Helper function to format time string to HH:MM
const formatTimeToHHMM = (timeStr: string): string => {
  if (!timeStr || !timeStr.includes(':')) return ''; // Return empty if invalid
  const [hours, minutes] = timeStr.split(':');
  const paddedHours = hours.padStart(2, '0');
  const paddedMinutes = minutes.padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
};

export function PeriodsDialog({ isOpen, onClose, period, schoolId, onSuccess }: PeriodsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [formData, setFormData] = useState<Omit<Period, 'id'>>({
    schoolId,
    time: '',
    label: '',
    type: 'class',
    orderIndex: 0,
  })

  // Log state on every render to see its actual value
  console.log("Rendering PeriodsDialog with state:", { startTime, endTime });

  useEffect(() => {
    if (isOpen) {
      if (period) {
        const [startStr = '', endStr = ''] = period.time.split(' - ');
        // Format the times correctly before setting state
        const formattedStartTime = formatTimeToHHMM(startStr);
        const formattedEndTime = formatTimeToHHMM(endStr);
        
        console.log("Inside useEffect - setting formatted state with:", { formattedStartTime, formattedEndTime });
        setStartTime(formattedStartTime);
        setEndTime(formattedEndTime);
        setFormData({
          schoolId: period.schoolId,
          time: period.time, // Keep original combined time if needed
          label: period.label,
          type: period.type,
          orderIndex: period.orderIndex,
        });
      } else {
        // Reset form
        setStartTime('');
        setEndTime('');
        setFormData({
          schoolId,
          time: '',
          label: '',
          type: 'class',
          orderIndex: 0,
        });
      }
    }
  }, [isOpen, period, schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // --- Frontend Validation --- 
    if (!startTime) {
      toast.error("Start Time is required.");
      return;
    }
    if (!endTime) {
      toast.error("End Time is required.");
      return;
    }
    if (!formData.label.trim()) { // Check if label is empty or just whitespace
      toast.error("Label cannot be empty.");
      return;
    }
    // Optional: Add validation for startTime < endTime if needed
    // --- End Frontend Validation --- 

    setIsSubmitting(true)

    try {
      // Ensure times are formatted correctly before combining (though they should be from state)
      const formattedStart = formatTimeToHHMM(startTime);
      const formattedEnd = formatTimeToHHMM(endTime);
      const combinedTime = `${formattedStart} - ${formattedEnd}`
      
      const response = await fetch(`/api/periods${period?.id ? `/${period.id}` : ''}`, {
        method: period?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          time: combinedTime,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'ORDER_CONFLICT') {
          toast.error('A period with this order index already exists')
        } else {
          toast.error(data.error || 'Failed to save period')
        }
        return
      }

      toast.success(`Period ${period ? 'updated' : 'created'} successfully`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('An error occurred while saving the period')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!period?.id) return

    if (!confirm('Are you sure you want to delete this period?')) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/periods/${period.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete period')
        return
      }

      toast.success('Period deleted successfully')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('An error occurred while deleting the period')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent key={period?.id || 'add-period'}>
        <DialogHeader>
          <DialogTitle>{period ? 'Edit Period' : 'Add Period'}</DialogTitle>
          <DialogDescription>
            {period ? 'Update the period details below.' : 'Create a new period by filling out the form below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., First Period"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'class' | 'break') => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="break">Break</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderIndex">Order</Label>
            <Input
              id="orderIndex"
              type="number"
              min="0"
              value={formData.orderIndex}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                // Handle NaN case: default to 0 if parsing fails (e.g., empty input)
                setFormData({ 
                  ...formData, 
                  orderIndex: isNaN(value) ? 0 : value 
                });
              }}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            {period && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : period ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 