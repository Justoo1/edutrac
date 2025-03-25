// components/home/HeroSection.tsx
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Managing Schools <span className="text-yellow-300">Simplified</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              EduTrac helps schools in Ghana manage students, staff, and resources with a 
              comprehensive digital platform designed for the local education system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href={`${process.env.NEXT_PUBLIC_APP_URL}/login`} 
                className="px-8 py-3 bg-white text-blue-700 font-medium rounded-lg text-center hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg text-center hover:bg-white hover:text-blue-700 transition-colors"
              >
                Request Demo
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0">
            <div className="relative h-64 md:h-96 w-full rounded-lg shadow-xl overflow-hidden">
              <Image
                src="/images/dashboard-preview.jpg"
                alt="EduTrac Dashboard Preview"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="bg-white">
        <svg
          className="w-full h-16 text-blue-600 fill-current"
          viewBox="0 0 1440 72"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 72L60 64.7C120 57.3 240 42.7 360 37.3C480 32 600 36 720 42.7C840 49.3 960 58.7 1080 59.2C1200 59.7 1320 51.3 1380 47.2L1440 43L1440 0L1380 0C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0L0 0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}