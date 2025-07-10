import React from "react";
import { Users, Star, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockType } from "./types";

// Staff Grid Block
export const StaffGridBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultStaff = [
    {
      name: "Dr. Sarah Johnson",
      position: "Principal",
      experience: "20 years in education",
      email: "s.johnson@school.edu",
      bio: "Passionate educator committed to student success and innovation in learning.",
      image: ""
    },
    {
      name: "Mr. David Chen",
      position: "Vice Principal",
      experience: "15 years teaching experience",
      email: "d.chen@school.edu",
      bio: "Dedicated to creating a supportive learning environment for all students.",
      image: ""
    },
    {
      name: "Ms. Emily Rodriguez",
      position: "Head of Academics",
      experience: "12 years in curriculum development",
      email: "e.rodriguez@school.edu",
      bio: "Expert in modern teaching methodologies and student assessment.",
      image: ""
    }
  ];

  return (
    <div className="bg-gray-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "Meet Our Staff"}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(block.content?.staff || defaultStaff).map((member: any, index: number) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-12 w-12 text-blue-600" />
                  )}
                </div>
                <CardTitle className="text-xl text-gray-900">{member.name}</CardTitle>
                <p className="text-blue-600 font-medium">{member.position}</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2 text-sm">{member.experience}</p>
                <p className="text-sm text-blue-600">{member.email}</p>
                {member.bio && (
                  <p className="text-gray-600 text-sm mt-3 leading-relaxed">{member.bio}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Student Testimonials Block
export const StudentTestimonialsBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultTestimonials = [
    {
      text: "This school has given me the confidence and skills I need to succeed. The teachers really care about each student and help us reach our potential.",
      author: "Alex Johnson",
      grade: "Grade 12",
      image: ""
    },
    {
      text: "I love the variety of activities and the supportive environment. I've made lifelong friends here and discovered my passion for science.",
      author: "Maria Garcia",
      grade: "Grade 10",
      image: ""
    }
  ];

  return (
    <div className="bg-blue-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "What Our Students Say"}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {(block.content?.testimonials || defaultTestimonials).map((testimonial: any, index: number) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {testimonial.image ? (
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Parent Testimonials Block
export const ParentTestimonialsBlock: React.FC<{ block: any }> = ({ block }) => {
  const defaultTestimonials = [
    {
      text: "Our daughter has thrived at this school. The personalized attention and high academic standards have exceeded our expectations.",
      author: "Jennifer Miller",
      relation: "Parent of Grade 9 Student",
      image: ""
    },
    {
      text: "The school's commitment to character development alongside academics makes it truly special. Our son has grown tremendously.",
      author: "Michael Chang",
      relation: "Parent of Grade 7 Student",
      image: ""
    }
  ];

  return (
    <div className="bg-green-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {block.content?.title || "What Parents Say"}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {(block.content?.testimonials || defaultTestimonials).map((testimonial: any, index: number) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className="h-5 w-5 text-red-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                    {testimonial.image ? (
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.relation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Block Type Definitions
export const COMMUNITY_BLOCKS: BlockType[] = [
  {
    type: "staff-grid",
    label: "Staff Directory",
    icon: Users,
    description: "Staff members grid",
    category: "Community",
    defaultContent: {
      title: "Meet Our Dedicated Staff",
      staff: [
        {
          name: "Dr. Sarah Johnson",
          position: "Principal",
          experience: "20 years in education",
          email: "s.johnson@school.edu",
          bio: "Passionate educator committed to student success and innovation in learning.",
          image: ""
        },
        {
          name: "Mr. David Chen",
          position: "Vice Principal",
          experience: "15 years teaching experience",
          email: "d.chen@school.edu",
          bio: "Dedicated to creating a supportive learning environment for all students.",
          image: ""
        },
        {
          name: "Ms. Emily Rodriguez",
          position: "Head of Academics",
          experience: "12 years in curriculum development",
          email: "e.rodriguez@school.edu",
          bio: "Expert in modern teaching methodologies and student assessment.",
          image: ""
        }
      ]
    }
  },
  {
    type: "student-testimonials",
    label: "Student Testimonials",
    icon: Star,
    description: "Student reviews",
    category: "Community",
    defaultContent: {
      title: "What Our Students Say",
      testimonials: [
        {
          text: "This school has given me the confidence and skills I need to succeed. The teachers really care about each student and help us reach our potential.",
          author: "Alex Johnson",
          grade: "Grade 12",
          image: ""
        },
        {
          text: "I love the variety of activities and the supportive environment. I've made lifelong friends here and discovered my passion for science.",
          author: "Maria Garcia",
          grade: "Grade 10",
          image: ""
        },
        {
          text: "The teachers make learning fun and engaging. I especially enjoy the hands-on projects and group work that help us learn together.",
          author: "Sam Thompson",
          grade: "Grade 8",
          image: ""
        },
        {
          text: "Coming to this school was the best decision. The academic support and extracurricular opportunities have prepared me for college.",
          author: "Priya Patel",
          grade: "Grade 11",
          image: ""
        }
      ]
    }
  },
  {
    type: "parent-testimonials",
    label: "Parent Testimonials",
    icon: Heart,
    description: "Parent reviews",
    category: "Community",
    defaultContent: {
      title: "What Parents Say",
      testimonials: [
        {
          text: "Our daughter has thrived at this school. The personalized attention and high academic standards have exceeded our expectations.",
          author: "Jennifer Miller",
          relation: "Parent of Grade 9 Student",
          image: ""
        },
        {
          text: "The school's commitment to character development alongside academics makes it truly special. Our son has grown tremendously.",
          author: "Michael Chang",
          relation: "Parent of Grade 7 Student",
          image: ""
        },
        {
          text: "Excellent communication from staff and a welcoming community atmosphere. We feel like part of the school family.",
          author: "Sarah Williams",
          relation: "Parent of Grade 5 Student",
          image: ""
        },
        {
          text: "The teachers go above and beyond to support each child's unique needs. We're grateful for the nurturing environment.",
          author: "David Brown",
          relation: "Parent of Grade 3 Student",
          image: ""
        }
      ]
    }
  }
];

// Get default content function
export const getCommunityDefaultContent = (type: string) => {
  const block = COMMUNITY_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
