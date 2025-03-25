// components/home/CTASection.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your School?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of schools across Ghana that are already using EduTrac to improve their administrative efficiency and educational outcomes.
            </p>
            
            <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex">
              <Link
                href="/signup"
                className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-blue-700"
              >
                Start Free Trial
              </Link>
              <Link
                href="/demo"
                className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 focus:ring-offset-blue-700"
              >
                Schedule a Demo
              </Link>
            </div>
            
            <div className="mt-12">
              <p className="text-blue-100 font-medium mb-4">Trusted by schools throughout Ghana:</p>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center justify-center h-16">
                  <Image
                    src="/logos/ghana-education.png" 
                    alt="Ghana Education Service"
                    width={100}
                    height={40}
                    className="max-h-10 w-auto"
                  />
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center justify-center h-16">
                  <Image
                    src="/logos/accra-academy.png" 
                    alt="Accra Academy"
                    width={100}
                    height={40}
                    className="max-h-10 w-auto"
                  />
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center justify-center h-16">
                  <Image
                    src="/logos/wesley-girls.png" 
                    alt="Wesley Girls' High School"
                    width={100}
                    height={40}
                    className="max-h-10 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block relative h-[500px]">
            <div className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-2xl transform rotate-3 z-10">
              <Image
                src="/images/dashboard-preview.jpg"
                alt="EduTrac Dashboard Preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-blue-500 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 translate-x-4 translate-y-4">
              <Image
                src="/images/mobile-preview.jpg"
                alt="EduTrac Mobile Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}