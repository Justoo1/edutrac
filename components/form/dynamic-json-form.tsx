"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface DynamicJsonFormProps {
  label: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
}

export function DynamicJsonForm({ label, value, onChange, disabled }: DynamicJsonFormProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({
        ...value,
        [newKey.trim()]: newValue.trim(),
      });
      setNewKey("");
      setNewValue("");
    }
  };

  const handleRemove = (key: string) => {
    const newData = { ...value };
    delete newData[key];
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="space-y-2">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <Input value={key} disabled className="w-1/3" />
            <Input value={val} disabled className="w-1/3" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(key)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Field Name"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="w-1/3"
          disabled={disabled}
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-1/3"
          disabled={disabled}
        />
        <Button type="button" onClick={handleAdd} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
} 