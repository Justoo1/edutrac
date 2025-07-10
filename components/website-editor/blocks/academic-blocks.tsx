import React from "react";
import { BookOpen, Award, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlockType } from "./types";

// Academic Programs Block
export const ProgramsGridBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultPrograms = [
    {
      name: "Primary Education",
      description: "Foundation years focusing on core subjects and character development",
      grades: "K-5",
      icon: "👶"
    },
    {
      name: "Middle School",
      description: "Comprehensive curriculum with introduction to specialized subjects",
      grades: "6-8",
      icon: "📚"
    },
    {
      name: "High School",
      description: "Advanced preparation for higher education and career readiness",
      grades: "9-12",
      icon: "🎓"
    }
  ];

  return (
    <div className="bg-white py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "Our Academic Programs"}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {(block.content?.programs || defaultPrograms).map((program: any, index: number) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="text-4xl mb-4">{program.icon}</div>
                <CardTitle className="text-xl text-gray-900">{program.name}</CardTitle>
                <Badge variant="outline" className="mx-auto">{program.grades}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{program.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subjects List Block
export const SubjectsListBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultSubjects = [
    { name: "Mathematics", description: "Algebra, Geometry, Calculus", icon: "🔢", level: "All Levels" },
    { name: "Science", description: "Biology, Chemistry, Physics", icon: "🔬", level: "All Levels" },
    { name: "English Language Arts", description: "Literature, Writing, Communication", icon: "📝", level: "All Levels" },
    { name: "Social Studies", description: "History, Geography, Civics", icon: "🌍", level: "All Levels" },
    { name: "Arts", description: "Visual Arts, Music, Drama", icon: "🎨", level: "All Levels" },
    { name: "Physical Education", description: "Sports, Health, Fitness", icon: "⚽", level: "All Levels" }
  ];

  return (
    <div className="bg-gray-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "Subjects We Offer"}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(block.content?.subjects || defaultSubjects).map((subject: any, index: number) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{subject.icon || "📚"}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{subject.name}</h3>
              </div>
              <p className="text-gray-600 text-sm">{subject.description}</p>
              {subject.level && (
                <Badge variant="secondary" className="mt-2">{subject.level}</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Achievements Block
export const AchievementsBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultAchievements = [
    {
      title: "National Science Fair Winner",
      description: "Our students won first place in the national science competition",
      year: "2023"
    },
    {
      title: "Excellence in Education Award",
      description: "Recognized by the Department of Education for outstanding performance",
      year: "2023"
    },
    {
      title: "100% University Acceptance",
      description: "All graduating seniors accepted to universities of their choice",
      year: "2023"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {block.content?.title || "Our Achievements"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {block.content?.subtitle || "We're proud of our students' and school's accomplishments"}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(block.content?.achievements || defaultAchievements).map((achievement: any, index: number) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-md bg-white">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                <div className="text-xs text-gray-500">{achievement.year}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Block Type Definitions
export const ACADEMIC_BLOCKS: BlockType[] = [
  {
    type: "programs-grid",
    label: "Academic Programs",
    icon: BookOpen,
    description: "Programs overview",
    category: "Academic",
    defaultContent: {
      title: "Our Academic Programs",
      programs: [
        {
          name: "Primary Education",
          description: "Foundation years focusing on core subjects and character development",
          grades: "K-5",
          icon: "👶"
        },
        {
          name: "Middle School",
          description: "Comprehensive curriculum with introduction to specialized subjects",
          grades: "6-8",
          icon: "📚"
        },
        {
          name: "High School",
          description: "Advanced preparation for higher education and career readiness",
          grades: "9-12",
          icon: "🎓"
        }
      ]
    }
  },
  {
    type: "subjects-list",
    label: "Subjects Offered",
    icon: Lightbulb,
    description: "List of subjects",
    category: "Academic",
    defaultContent: {
      title: "Subjects We Offer",
      subjects: [
        { name: "Mathematics", description: "Algebra, Geometry, Calculus", icon: "🔢", level: "All Levels" },
        { name: "Science", description: "Biology, Chemistry, Physics", icon: "🔬", level: "All Levels" },
        { name: "English Language Arts", description: "Literature, Writing, Communication", icon: "📝", level: "All Levels" },
        { name: "Social Studies", description: "History, Geography, Civics", icon: "🌍", level: "All Levels" },
        { name: "Arts", description: "Visual Arts, Music, Drama", icon: "🎨", level: "All Levels" },
        { name: "Physical Education", description: "Sports, Health, Fitness", icon: "⚽", level: "All Levels" }
      ]
    }
  },
  {
    type: "achievements",
    label: "Achievements",
    icon: Award,
    description: "School achievements",
    category: "Academic",
    defaultContent: {
      title: "Our Achievements",
      subtitle: "We're proud of our students' and school's accomplishments",
      achievements: [
        {
          title: "National Science Fair Winner",
          description: "Our students won first place in the national science competition",
          year: "2023"
        },
        {
          title: "Excellence in Education Award",
          description: "Recognized by the Department of Education for outstanding performance",
          year: "2023"
        },
        {
          title: "100% University Acceptance",
          description: "All graduating seniors accepted to universities of their choice",
          year: "2023"
        }
      ]
    }
  }
];

// Get default content function
export const getAcademicDefaultContent = (type: string) => {
  const block = ACADEMIC_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
