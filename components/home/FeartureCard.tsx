// components/home/FeatureCard.tsx
import { 
    Users, 
    School, 
    BookOpen, 
    DollarSign, 
    MessageSquare, 
    BarChart3 
  } from 'lucide-react';
  
  // Define prop types for the component
  interface FeatureCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
  }
  
  export default function FeatureCard({ title, description, icon, color }: FeatureCardProps) {
    // Function to determine which icon to render
    const renderIcon = () => {
      switch (icon) {
        case 'students':
          return <Users className="h-6 w-6" />;
        case 'staff':
          return <School className="h-6 w-6" />;
        case 'academic':
          return <BookOpen className="h-6 w-6" />;
        case 'finance':
          return <DollarSign className="h-6 w-6" />;
        case 'communication':
          return <MessageSquare className="h-6 w-6" />;
        case 'analytics':
          return <BarChart3 className="h-6 w-6" />;
        default:
          return <Users className="h-6 w-6" />;
      }
    };
  
    // Function to determine background color class
    const getBgColorClass = () => {
      switch (color) {
        case 'blue':
          return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
        case 'green':
          return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
        case 'purple':
          return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
        case 'yellow':
          return 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300';
        case 'red':
          return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
        case 'cyan':
          return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300';
        default:
          return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
      }
    };
  
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700">
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${getBgColorClass()}`}>
          {renderIcon()}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    );
  }