// User Profile Types
export interface UserProfile {
    name: string;
    grade: number;
    email: string;
    phone: string;
    dateOfBirth: string;
    avatarUrl?: string;
  }
  
  // Widget Types
  export interface WidgetData {
    title: string;
    value: number;
    unit?: string;
    icon?: string;
  }
  
  // Calendar Types
  export interface CalendarDay {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasEvent: boolean;
  }
  
  // Activity Types
  export type ActivityType = 'reminder' | 'submission' | 'received' | 'award';
  
  export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    time: string;
    date: Date;
    icon?: string;
  }
  
  // Agenda Types
  export interface AgendaItem {
    id: string;
    title: string;
    date: Date;
    time?: string;
    subject: string;
  }
  
  // Message Types
  export interface Message {
    id: string;
    sender: {
      name: string;
      avatar?: string;
    };
    content: string;
    time: string;
    date: Date;
    isRead: boolean;
  }
  
  // Assignment Types
  export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Completed';
  
  export interface Assignment {
    id: string;
    number: string;
    title: string;
    subject: string;
    dueDate: Date;
    time: string;
    status: AssignmentStatus;
  }
  
  // Chart Types
  export interface ScoreDataPoint {
    date: string;
    score: number;
  }
  
  export interface SubjectGrade {
    subject: string;
    grade: number;
    maxGrade: number;
  }