import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (settings: {
    showRoomNumbers: boolean
    showTeacherNames: boolean
    showClassNames: boolean
    periodDuration: number
  }) => void
  initialSettings?: {
    showRoomNumbers: boolean
    showTeacherNames: boolean
    showClassNames: boolean
    periodDuration: number
  }
}

export function SettingsDialog({ isOpen, onOpenChange, onSave, initialSettings }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    showRoomNumbers: initialSettings?.showRoomNumbers ?? true,
    showTeacherNames: initialSettings?.showTeacherNames ?? true,
    showClassNames: initialSettings?.showClassNames ?? true,
    periodDuration: initialSettings?.periodDuration ?? 60,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timetable Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showRoomNumbers">Show Room Numbers</Label>
            <Switch
              id="showRoomNumbers"
              checked={settings.showRoomNumbers}
              onCheckedChange={(checked) => setSettings({ ...settings, showRoomNumbers: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showTeacherNames">Show Teacher Names</Label>
            <Switch
              id="showTeacherNames"
              checked={settings.showTeacherNames}
              onCheckedChange={(checked) => setSettings({ ...settings, showTeacherNames: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showClassNames">Show Class Names</Label>
            <Switch
              id="showClassNames"
              checked={settings.showClassNames}
              onCheckedChange={(checked) => setSettings({ ...settings, showClassNames: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodDuration">Period Duration (minutes)</Label>
            <Input
              id="periodDuration"
              type="number"
              min={30}
              max={120}
              value={settings.periodDuration}
              onChange={(e) => setSettings({ ...settings, periodDuration: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onSave(settings)}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 