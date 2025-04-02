// app/home/page.tsx
import HeroSection from '@/components/home/HeroSection';
import VideoDemo from '@/components/home/VideoDemo';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import GhanaContext from '@/components/home/GhanaContext';
import PricingSection from '@/components/home/PricingSection';
import FAQSection from '@/components/home/FAQSection';
import CTASection from '@/components/home/CTASection';

export default async function HomePage() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <HeroSection />
      <VideoDemo />
      <FeaturesSection />
      <TestimonialsSection />
      <GhanaContext />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}