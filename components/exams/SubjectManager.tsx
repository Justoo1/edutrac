"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectSubject } from "@/lib/schema";
import { getSubjectsForSchool } from "@/lib/fetchers";

interface SubjectManagerProps {
  schoolType: 'BASIC' | 'SHS' | null;
  schoolId: string;
  selectedSubjects: SelectSubject[];
  onSubjectChange: (subjects: SelectSubject[]) => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({
  schoolType,
  selectedSubjects,
  schoolId,
  onSubjectChange,
}) => {
  const [subjects, setSubjects] = useState<SelectSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const fetchedSubjects = await getSubjectsForSchool(schoolId);
        setSubjects(fetchedSubjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          code: subject.code || subject.name.substring(0, 4).toUpperCase(),
          isOptional: subject.isOptional || false,
          schoolId: subject.schoolId,
          description: subject.description,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
          courseId: subject.courseId
        })));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [schoolId]);

  const handleSubjectToggle = (subject: SelectSubject) => {
    const isSelected = selectedSubjects.some(s => s.id === subject.id);
    if (isSelected) {
      onSubjectChange(selectedSubjects.filter(s => s.id !== subject.id));
    } else {
      onSubjectChange([...selectedSubjects, subject]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading subjects...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Subjects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {subjects.map(subject => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={subject.id}
                  checked={selectedSubjects.some(s => s.id === subject.id)}
                  onCheckedChange={() => handleSubjectToggle(subject)}
                />
                <Label htmlFor={subject.id}>{subject.name}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectManager; 