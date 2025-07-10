import React from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Heart, BookOpen } from "lucide-react";
import { BlockType } from "./types";

// Hero Welcome Block
export const HeroWelcomeBlock: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 py-24 px-8 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          {block.content?.title || "Welcome to Our School"}
        </h1>
        <p className="text-2xl mb-4 font-medium text-blue-100">
          {block.content?.subtitle || "Excellence in Education"}
        </p>
        <p className="text-lg mb-8 max-w-3xl mx-auto text-blue-50">
          {block.content?.description || "Providing quality education for tomorrow's leaders"}
        </p>
        <Button 
          size="lg" 
          className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg"
        >
          {block.content?.buttonText || "Learn More"}
        </Button>
      </div>
    </div>
  );
};

// Hero About Block
export const HeroAboutBlock: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 py-24 px-8 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          {block.content?.title || "About Our School"}
        </h1>
        <p className="text-2xl mb-4 font-medium text-green-100">
          {block.content?.subtitle || "Excellence in Education Since 1990"}
        </p>
        <p className="text-lg mb-8 max-w-3xl mx-auto text-green-50">
          {block.content?.description || "Discover our rich history, dedicated faculty, and commitment to student success."}
        </p>
        <Button 
          size="lg" 
          className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-3 text-lg"
        >
          {block.content?.buttonText || "Our Story"}
        </Button>
      </div>
    </div>
  );
};

// Hero Admissions Block
export const HeroAdmissionsBlock: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 py-24 px-8 text-center">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          {block.content?.title || "Join Our School Family"}
        </h1>
        <p className="text-2xl mb-4 font-medium text-purple-100">
          {block.content?.subtitle || "Applications Now Open for 2024-2025"}
        </p>
        <p className="text-lg mb-8 max-w-3xl mx-auto text-purple-50">
          {block.content?.description || "Start your journey with us. Apply today and become part of our learning community."}
        </p>
        <Button 
          size="lg" 
          className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-3 text-lg"
        >
          {block.content?.buttonText || "Apply Now"}
        </Button>
      </div>
    </div>
  );
};

// Block Type Definitions
export const HERO_BLOCKS: BlockType[] = [
  {
    type: "hero-welcome",
    label: "Welcome Hero",
    icon: GraduationCap,
    description: "School welcome banner",
    category: "Hero",
    defaultContent: {
      title: "Welcome to Our School",
      subtitle: "Nurturing Excellence, Building Tomorrow's Leaders",
      description: "We provide quality education that prepares students for success in an ever-changing world.",
      buttonText: "Learn More",
      buttonLink: "/about"
    }
  },
  {
    type: "hero-about",
    label: "About Hero",
    icon: Heart,
    description: "About us banner",
    category: "Hero",
    defaultContent: {
      title: "About Our School",
      subtitle: "Excellence in Education Since 1990",
      description: "Discover our rich history, dedicated faculty, and commitment to student success.",
      buttonText: "Our Story",
      buttonLink: "/history"
    }
  },
  {
    type: "hero-admissions",
    label: "Admissions Hero",
    icon: BookOpen,
    description: "Admissions banner",
    category: "Hero",
    defaultContent: {
      title: "Join Our School Family",
      subtitle: "Applications Now Open for 2024-2025",
      description: "Start your journey with us. Apply today and become part of our learning community.",
      buttonText: "Apply Now",
      buttonLink: "/admissions"
    }
  }
];

// Get default content function
export const getHeroDefaultContent = (type: string) => {
  const block = HERO_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
