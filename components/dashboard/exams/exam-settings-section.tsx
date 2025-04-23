"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamSettingsSectionProps {
  schoolId: string;
}

export default function ExamSettingsSection({ schoolId }: ExamSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p>No exam settings found</p>
      </CardContent>
    </Card>
  );
} 