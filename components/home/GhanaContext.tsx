// components/home/GhanaContext.tsx
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

export default function GhanaContext() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative h-[500px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/images/ghana-classroom.jpg"
                alt="Classroom in Ghana"
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Designed for Ghana&apos;s Education System
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              EduTrac isn&apos;t just another school management system. It&apos;s built from the ground up to address the unique challenges and requirements of Ghana&apos;s basic education system.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Ghana Education Service (GES) Compliant
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Aligned with GES requirements for easier reporting and compliance with national education standards.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Works with Limited Connectivity
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Offline capabilities ensure schools in areas with unreliable internet can still benefit from digital management.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Mobile Money Integration
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Seamless fee collection through popular mobile money platforms in Ghana for easier financial management.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    BECE Preparation Tools
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Specialized resources to help schools prepare students for the Basic Education Certificate Examination.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Local Language Support
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Interface available in English and major Ghanaian languages to ensure accessibility for all stakeholders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}