"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentExamsSectionProps {
  schoolId: string;
}

export default function RecentExamsSection({ schoolId }: RecentExamsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Exams</CardTitle>
      </CardHeader>
      <CardContent>
        <p>No recent exams found</p>
      </CardContent>
    </Card>
  );
} 