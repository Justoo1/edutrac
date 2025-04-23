"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssessmentTypesSectionProps {
  schoolId: string;
}

export default function AssessmentTypesSection({ schoolId }: AssessmentTypesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Types</CardTitle>
      </CardHeader>
      <CardContent>
        <p>No assessment types found</p>
      </CardContent>
    </Card>
  );
} 