import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, BookOpen, Target } from 'lucide-react';

interface Grade {
  name: string;
  score: number;
  grade: string;
  remarks: string;
  batchPosition: number;
  classPosition: number;
  classScore: string;
  examScore: string;
  totalScore: string;
}

interface TermGrades {
  term: string;
  academicYear?: string;
  academicTerm?: string;
  subjects: Grade[];
  totalScore?: number;
  averageScore?: number;
  rank?: string;
}

interface PerformanceChartProps {
  grades: TermGrades[];
  studentAverage: number;
  classAverage: number;
}

export function PerformanceChart({ grades, studentAverage, classAverage }: PerformanceChartProps) {
  // Process data for different chart types
  const processedData = React.useMemo(() => {
    // 1. Subject Performance Over Time
    const subjectTrends: any[] = [];
    const allSubjects = [...new Set(grades.flatMap(term => term.subjects.map(s => s.name)))];
    
    grades.forEach((term, termIndex) => {
      const termData: any = { 
        term: term.academicTerm || term.term,
        termIndex: termIndex + 1
      };
      
      term.subjects.forEach(subject => {
        termData[subject.name] = Number(subject.totalScore) || subject.score;
      });
      
      // Add term average
      const termAverage = term.averageScore || 
        (term.subjects.reduce((sum, s) => sum + (Number(s.totalScore) || s.score), 0) / term.subjects.length);
      termData.average = Math.round(termAverage * 10) / 10;
      
      subjectTrends.push(termData);
    });

    // 2. Latest Subject Performance (Radar Chart)
    const latestTerm = grades[grades.length - 1];
    const subjectRadarData = latestTerm?.subjects.map(subject => ({
      subject: subject.name,
      score: Number(subject.totalScore) || subject.score,
      classScore: Number(subject.classScore) || 0,
      examScore: Number(subject.examScore) || 0,
      fullMark: 100
    })) || [];

    // 3. Performance vs Class Average
    const comparisonData = grades.map((term, index) => {
      const studentTermAvg = term.averageScore || 
        (term.subjects.reduce((sum, s) => sum + (Number(s.totalScore) || s.score), 0) / term.subjects.length);
      
      return {
        term: term.academicTerm || term.term,
        studentAverage: Math.round(studentTermAvg * 10) / 10,
        classAverage: classAverage, // Could be dynamic per term if available
        difference: Math.round((studentTermAvg - classAverage) * 10) / 10
      };
    });

    // 4. Grade Distribution
    const gradeDistribution: { [key: string]: number } = {};
    grades.forEach(term => {
      term.subjects.forEach(subject => {
        gradeDistribution[subject.grade] = (gradeDistribution[subject.grade] || 0) + 1;
      });
    });

    const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / grades.reduce((sum, t) => sum + t.subjects.length, 0)) * 100)
    }));

    return {
      subjectTrends,
      subjectRadarData,
      comparisonData,
      gradeData,
      allSubjects
    };
  }, [grades, classAverage]);

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}${typeof entry.value === 'number' ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate colors for subjects
  const getSubjectColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
      '#0088fe', '#ff8042', '#8dd1e1', '#d084d0', '#87d068'
    ];
    return colors[index % colors.length];
  };

  // Calculate trend
  const calculateTrend = () => {
    if (processedData.comparisonData.length < 2) return { trend: 'neutral', change: 0 };
    
    const latest = processedData.comparisonData[processedData.comparisonData.length - 1];
    const previous = processedData.comparisonData[processedData.comparisonData.length - 2];
    const change = latest.studentAverage - previous.studentAverage;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: Math.abs(change)
    };
  };

  const trend = calculateTrend();

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Average</p>
                <p className="text-2xl font-bold">{studentAverage}%</p>
              </div>
              <div className="flex items-center">
                {trend.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                {trend.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                {trend.trend === 'neutral' && <Minus className="h-5 w-5 text-gray-500" />}
                <span className="text-sm ml-1">
                  {trend.change > 0 ? `±${trend.change}%` : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Average</p>
                <p className="text-2xl font-bold">{classAverage}%</p>
              </div>
              <Target className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Gap</p>
                <p className={`text-2xl font-bold ${studentAverage > classAverage ? 'text-green-600' : 'text-red-600'}`}>
                  {studentAverage > classAverage ? '+' : ''}{(studentAverage - classAverage).toFixed(1)}%
                </p>
              </div>
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Subject Trends</TabsTrigger>
          <TabsTrigger value="comparison">vs Class Average</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedData.subjectTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="term" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {processedData.allSubjects.map((subject, index) => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        stroke={getSubjectColor(index)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#000000"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 6 }}
                      name="Term Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Class Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={processedData.comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="term" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="classAverage"
                      fill="#e2e8f0"
                      stroke="#64748b"
                      strokeWidth={2}
                      name="Class Average"
                    />
                    <Line
                      type="monotone"
                      dataKey="studentAverage"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      name="Student Average"
                    />
                    <Bar
                      dataKey="difference"
                      fill="#10b981"
                      name="Difference"
                      opacity={0.6}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latest Term Subject Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={processedData.subjectRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Total Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Class Score"
                      dataKey="classScore"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Exam Score"
                      dataKey="examScore"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.gradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8884d8" name="Number of Subjects" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {processedData.gradeData.map((item, index) => (
                  <div key={item.grade} className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="font-bold text-lg">{item.grade}</p>
                    <p className="text-sm text-muted-foreground">{item.count} subjects</p>
                    <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}