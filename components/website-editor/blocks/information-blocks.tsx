import React from "react";
import { MapPin, Phone, Mail, Clock, Zap, Target, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlockType } from "./types";

// School Information Block
export const SchoolInfoBlock: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="bg-white py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {block.content?.schoolName || "Our School"}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-600">{block.content?.address || "123 School Street, Education City"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-gray-600">{block.content?.phone || "+1 (555) 123-4567"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">{block.content?.email || "info@school.edu"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Hours</p>
                  <p className="text-gray-600">{block.content?.hours || "Monday - Friday: 8:00 AM - 4:00 PM"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Quick Contact</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Main Office</p>
                <p className="font-semibold text-blue-900">{block.content?.phone || "+1 (555) 123-4567"}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Email Us</p>
                <p className="font-semibold text-blue-900">{block.content?.email || "info@school.edu"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Facts Block
export const QuickFactsBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultFacts = [
    { label: "Students Enrolled", value: "1,200+" },
    { label: "Teaching Staff", value: "85" },
    { label: "Years of Excellence", value: "30+" },
    { label: "Graduation Rate", value: "98%" },
    { label: "Student-Teacher Ratio", value: "15:1" },
    { label: "Extracurricular Activities", value: "40+" }
  ];

  return (
    <div className="bg-gray-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "Quick Facts"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {(block.content?.facts || defaultFacts).map((fact: any, index: number) => (
            <div key={index} className="text-center">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-blue-600 mb-2">{fact.value}</div>
                <div className="text-gray-700 font-medium">{fact.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mission & Vision Block
export const MissionVisionBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultValues = ["Excellence", "Integrity", "Innovation", "Inclusivity", "Community"];

  return (
    <div className="bg-white py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-blue-50 p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-blue-900">Our Mission</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {block.content?.mission || "To provide quality education that develops critical thinking, creativity, and character in every student."}
            </p>
          </div>
          <div className="bg-purple-50 p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-8 w-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-purple-900">Our Vision</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {block.content?.vision || "To be a leading educational institution that empowers students to become responsible global citizens."}
            </p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {(block.content?.values || defaultValues).map((value: string, index: number) => (
              <Badge key={index} variant="secondary" className="px-4 py-2 text-sm">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Block Type Definitions
export const INFORMATION_BLOCKS: BlockType[] = [
  {
    type: "school-info",
    label: "School Information",
    icon: MapPin,
    description: "Contact & location info",
    category: "Information",
    defaultContent: {
      schoolName: "Our School Name",
      address: "123 School Street, Education City, EC 12345",
      phone: "+1 (555) 123-4567",
      email: "info@ourschool.edu",
      website: "www.ourschool.edu",
      hours: "Monday - Friday: 8:00 AM - 4:00 PM",
      established: "1990"
    }
  },
  {
    type: "quick-facts",
    label: "Quick Facts",
    icon: Zap,
    description: "Key school statistics",
    category: "Information",
    defaultContent: {
      title: "Quick Facts",
      facts: [
        { label: "Students Enrolled", value: "1,200+" },
        { label: "Teaching Staff", value: "85" },
        { label: "Years of Excellence", value: "30+" },
        { label: "Graduation Rate", value: "98%" },
        { label: "Student-Teacher Ratio", value: "15:1" },
        { label: "Extracurricular Activities", value: "40+" }
      ]
    }
  },
  {
    type: "mission-vision",
    label: "Mission & Vision",
    icon: Target,
    description: "School mission statement",
    category: "Information",
    defaultContent: {
      mission: "To provide quality education that develops critical thinking, creativity, and character in every student.",
      vision: "To be a leading educational institution that empowers students to become responsible global citizens.",
      values: ["Excellence", "Integrity", "Innovation", "Inclusivity", "Community"]
    }
  }
];

// Get default content function
export const getInformationDefaultContent = (type: string) => {
  const block = INFORMATION_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
