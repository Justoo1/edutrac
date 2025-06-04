// components/dashboard/exams/report-comments-manager.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Save, X, ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

// Define comment templates for different performance levels
const COMMENT_TEMPLATES = {
  excellent: [
    'An exceptional student who has demonstrated outstanding academic abilities.',
    'Excels in all subjects and shows remarkable understanding of complex concepts.',
    'Shows excellent work ethic and contributes valuably in class discussions.',
    'A model student who consistently produces work of the highest quality.'
  ],
  veryGood: [
    'Performs very well academically and shows strong understanding in most subjects.',
    'Produces high quality work consistently and participates actively in class.',
    'Shows strong dedication to studies and maintains good academic discipline.',
    'A hardworking student who continues to make impressive progress.'
  ],
  good: [
    'Shows good understanding of most subjects and produces quality work.',
    'A consistent student who participates well in class activities.',
    'Makes good progress and shows dedication to learning.',
    'Works diligently and shows good potential for further growth.'
  ],
  average: [
    'Demonstrates adequate understanding of subjects but needs to be more consistent.',
    'Shows potential but needs to put in more effort to improve grades.',
    'Participates in class but could benefit from more active engagement.',
    'Works at a satisfactory level but has potential to achieve more.'
  ],
  belowAverage: [
    'Struggles with understanding in some subjects and needs additional support.',
    'Shows inconsistent effort and must work harder to improve performance.',
    'Has potential but requires more dedication to academic work.',
    'Needs to pay more attention in class and complete assignments on time.'
  ],
  poor: [
    'Shows significant difficulty in understanding fundamental concepts.',
    'Requires immediate academic intervention and support.',
    'Needs to improve attendance and class participation substantially.',
    'Must demonstrate more commitment to studies to avoid repeating the term.'
  ]
};

// Comment categories
const COMMENT_TYPES = {
  teacher: 'Teacher Comments',
  headmaster: 'Headmaster Comments',
  additional: 'Additional Comments'
};

interface ReportCommentsManagerProps {
  schoolId: string;
  classId: string;
  academicYearId: string;
  academicTermId: string;
}

export const ReportCommentsManager: React.FC<ReportCommentsManagerProps> = ({
  schoolId,
  classId,
  academicYearId,
  academicTermId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [activeCommentType, setActiveCommentType] = useState<keyof typeof COMMENT_TYPES>('teacher');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch students data and their academic performance
  useEffect(() => {
    const fetchStudentsData = async () => {
      setIsLoading(true);
      try {
        // Fetch students with their class enrollments
        const response = await fetch(`/api/classes/${classId}/students`);
        if (!response.ok) throw new Error('Failed to fetch students');
        const studentsData = await response.json();
        
        // Fetch term report data for these students
        const reportsResponse = await fetch(
          `/api/reports/class/summary?classId=${classId}&academicYearId=${academicYearId}&academicTermId=${academicTermId}`
        );
        if (!reportsResponse.ok) throw new Error('Failed to fetch reports data');
        const reportsData = await reportsResponse.json();
        
        // Combine student data with their academic performance
        const enhancedStudents = studentsData.map((student: any) => {
          const reportData = reportsData.find((report: any) => report.studentId === student.id);
          return {
            ...student,
            performance: reportData ? {
              averageScore: reportData.averageScore,
              rank: reportData.rank,
              reportId: reportData.id
            } : {
              averageScore: 0,
              rank: 'N/A',
              reportId: null
            }
          };
        });
        
        // Sort students by name initially
        const sortedStudents = enhancedStudents.sort((a: any, b: any) => 
          `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`)
        );
        
        setStudents(sortedStudents);
        setFilteredStudents(sortedStudents);
        
        // Initialize comments object
        const initialComments: Record<string, any> = {};
        sortedStudents.forEach((student: any) => {
          initialComments[student.id] = {
            teacher: '',
            headmaster: '',
            additional: ''
          };
        });
        
        // Fetch existing comments
        if (reportsData.length > 0) {
          const commentsResponse = await fetch(
            `/api/reports/comments?classId=${classId}&academicYearId=${academicYearId}&academicTermId=${academicTermId}`
          );
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            
            // Update initialComments with existing comments
            commentsData.forEach((comment: any) => {
              if (initialComments[comment.studentId]) {
                initialComments[comment.studentId] = {
                  teacher: comment.teacherComment || '',
                  headmaster: comment.headComment || '',
                  additional: comment.additionalComments || ''
                };
              }
            });
          }
        }
        
        setComments(initialComments);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsData();
  }, [schoolId, classId, academicYearId, academicTermId]);

  // Filter and sort students
  useEffect(() => {
    let result = [...students];
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(student => 
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply performance filter
    if (performanceFilter !== 'all') {
      result = result.filter(student => {
        const score = student.performance?.averageScore || 0;
        
        switch (performanceFilter) {
          case 'excellent': return score >= 80;
          case 'veryGood': return score >= 70 && score < 80;
          case 'good': return score >= 60 && score < 70;
          case 'average': return score >= 50 && score < 60;
          case 'belowAverage': return score >= 40 && score < 50;
          case 'poor': return score < 40;
          default: return true;
        }
      });
    }
    
    // Apply sort
    result.sort((a, b) => {
      const scoreA = a.performance?.averageScore || 0;
      const scoreB = b.performance?.averageScore || 0;
      
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
    
    setFilteredStudents(result);
  }, [students, searchQuery, performanceFilter, sortOrder]);

  // Handle comment change
  const handleCommentChange = (studentId: string, value: string) => {
    setComments(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [activeCommentType]: value
      }
    }));
  };

  // Apply template comment
  const applyTemplate = (studentId: string, template: string) => {
    handleCommentChange(studentId, template);
  };

  // Bulk apply template to filtered students
  const bulkApplyTemplate = (templateKey: keyof typeof COMMENT_TEMPLATES) => {
    // Get a random template from the category
    const templates = COMMENT_TEMPLATES[templateKey];
    
    const updatedComments = { ...comments };
    
    filteredStudents.forEach(student => {
      // Pick a random comment from the template array
      const randomIndex = Math.floor(Math.random() * templates.length);
      const template = templates[randomIndex];
      
      updatedComments[student.id] = {
        ...updatedComments[student.id],
        [activeCommentType]: template
      };
    });
    
    setComments(updatedComments);
    toast.success(`Applied ${templateKey} templates to ${filteredStudents.length} students`);
  };

  // Save comments for all students
  const saveAllComments = async () => {
    setIsSaving(true);
    
    try {
      const commentsToSave = Object.entries(comments).map(([studentId, commentData]) => ({
        studentId,
        academicYearId,
        academicTermId,
        teacherComment: commentData.teacher,
        headComment: commentData.headmaster,
        additionalComments: commentData.additional
      }));
      
      const response = await fetch('/api/reports/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comments: commentsToSave
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save comments');
      }
      
      toast.success('All comments saved successfully');
    } catch (error) {
      console.error('Error saving comments:', error);
      toast.error('Failed to save comments');
    } finally {
      setIsSaving(false);
    }
  };

  // Get performance category for a student
  const getPerformanceCategory = (score: number): keyof typeof COMMENT_TEMPLATES => {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'veryGood';
    if (score >= 60) return 'good';
    if (score >= 50) return 'average';
    if (score >= 40) return 'belowAverage';
    return 'poor';
  };

  // Toggle expanded student
  const toggleExpandedStudent = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Report Comments Manager</CardTitle>
              <CardDescription>
                Add and manage comments for student terminal reports
              </CardDescription>
            </div>
            <Button
              onClick={saveAllComments}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Comments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCommentType} onValueChange={(val) => setActiveCommentType(val as keyof typeof COMMENT_TYPES)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="teacher">Teacher Comments</TabsTrigger>
                <TabsTrigger value="headmaster">Headmaster Comments</TabsTrigger>
                <TabsTrigger value="additional">Additional Comments</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {sortOrder === 'asc' ? 'Lowest First' : 'Highest First'}
                  </Button>
                  
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-1" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="excellent">Excellent (80+)</SelectItem>
                      <SelectItem value="veryGood">Very Good (70-79)</SelectItem>
                      <SelectItem value="good">Good (60-69)</SelectItem>
                      <SelectItem value="average">Average (50-59)</SelectItem>
                      <SelectItem value="belowAverage">Below Average (40-49)</SelectItem>
                      <SelectItem value="poor">Poor (Below 40)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick apply templates */}
            <div className="bg-muted p-3 rounded-md mb-4">
              <div className="text-sm font-medium mb-2">Quick Apply Templates:</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('excellent')}
                >
                  Apply Excellent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('veryGood')}
                >
                  Apply Very Good
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('good')}
                >
                  Apply Good
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('average')}
                >
                  Apply Average
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('belowAverage')}
                >
                  Apply Below Average
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkApplyTemplate('poor')}
                >
                  Apply Poor
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                *This will apply template comments to all {filteredStudents.length} filtered students for {COMMENT_TYPES[activeCommentType]}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found matching your criteria.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Student</TableHead>
                      <TableHead className="w-[100px] text-center">Average</TableHead>
                      <TableHead className="w-[100px] text-center">Position</TableHead>
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const performanceCategory = getPerformanceCategory(student.performance?.averageScore || 0);
                      
                      return (
                        <React.Fragment key={student.id}>
                          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpandedStudent(student.id)}>
                            <TableCell>
                              <div className="font-medium">
                                {student.lastName}, {student.firstName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.studentId}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {student.performance?.averageScore.toFixed(2) || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                              {student.performance?.rank || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <textarea
                                value={comments[student.id]?.[activeCommentType] || ''}
                                onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                className="w-full min-h-[60px] p-2 text-sm border rounded-md"
                                placeholder={`Add ${COMMENT_TYPES[activeCommentType]} here...`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                          </TableRow>
                          
                          {expandedStudent === student.id && (
                            <TableRow>
                              <TableCell colSpan={4} className="bg-muted/20 p-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Suggested {COMMENT_TYPES[activeCommentType]} Templates:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {COMMENT_TEMPLATES[performanceCategory].map((template, idx) => (
                                        <div 
                                          key={idx} 
                                          className="p-2 border rounded-md cursor-pointer hover:bg-primary/10"
                                          onClick={() => applyTemplate(student.id, template)}
                                        >
                                          {template}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Custom Comment:</h4>
                                    <Textarea
                                      value={comments[student.id]?.[activeCommentType] || ''}
                                      onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                      className="w-full min-h-[100px]"
                                      placeholder={`Add ${COMMENT_TYPES[activeCommentType]} here...`}
                                    />
                                    <div className="flex justify-end mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleExpandedStudent(student.id)}
                                      >
                                        Close
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students.length} students
          </div>
          <Button
            onClick={saveAllComments}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Comments
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
