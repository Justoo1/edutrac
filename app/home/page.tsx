// app/home/page.tsx
import HeroSection from '@/components/home/HeroSection';
import VideoDemo from '@/components/home/VideoDemo';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import GhanaContext from '@/components/home/GhanaContext';
import PricingSection from '@/components/home/PricingSection';
import FAQSection from '@/components/home/FAQSection';
import CTASection from '@/components/home/CTASection';
import HomeFooter from '@/components/home/HomeFooter';
import HomeHeader from '@/components/home/HomeHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <HomeHeader />
      <HeroSection />
      <VideoDemo />
      <FeaturesSection />
      <TestimonialsSection />
      <GhanaContext />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <HomeFooter />
    </div>
  );
}