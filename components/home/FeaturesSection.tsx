// components/home/FeaturesSection.tsx
import Link from "next/link";
import FeatureCard from "./FeartureCard";

// Define the features
const features = [
  {
    title: "Student Management",
    description: "Track student information, attendance, academic performance, and more in one centralized system.",
    icon: "students",
    color: "blue"
  },
  {
    title: "Staff Management",
    description: "Manage teacher profiles, qualifications, workload, and performance evaluations efficiently.",
    icon: "staff",
    color: "green"
  },
  {
    title: "Academic Management",
    description: "Handle curriculum planning, class scheduling, assessments, and report generation with ease.",
    icon: "academic",
    color: "purple"
  },
  {
    title: "Financial Management",
    description: "Streamline fee collection, manage budgets, and generate financial reports automatically.",
    icon: "finance",
    color: "yellow"
  },
  {
    title: "Communication Tools",
    description: "Enhance communication between administrators, teachers, students, and parents.",
    icon: "communication",
    color: "red"
  },
  {
    title: "Analytics & Reporting",
    description: "Gain valuable insights through comprehensive dashboards and detailed reports.",
    icon: "analytics",
    color: "cyan"
  }
];

export default function FeaturesSection() {
  return (
    <div className="w-full py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Transform Your School Management
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            EduTrac is designed specifically for Ghana&#39;s basic education system, supporting 
            schools with the tools they need to thrive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/features"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg inline-block hover:bg-blue-700 transition-colors"
          >
            Explore All Features
          </Link>
        </div>
      </div>
    </div>
  );
}