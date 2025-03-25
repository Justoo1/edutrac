'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@tremor/react';

const testimonials = [
  {
    id: 1,
    content: "EduTrac has transformed our school's administrative processes. We've cut down paperwork by 70% and can now focus more on actual teaching rather than administrative tasks.",
    author: "Grace Mensah",
    position: "Headmistress",
    school: "Accra Model School",
    image: "/testimonials/grace-mensah.jpg"
  },
  {
    id: 2,
    content: "The student tracking features have been invaluable. We can now easily monitor attendance, academic progress, and quickly identify students who need additional support.",
    author: "Francis Osei",
    position: "Deputy Headmaster",
    school: "Kumasi Primary School",
    image: "/testimonials/francis-osei.jpg"
  },
  {
    id: 3,
    content: "As a parent, I appreciate having real-time access to my child's academic performance and school activities. The communication tools make it easy to stay in touch with teachers.",
    author: "Abena Koranteng",
    position: "Parent",
    school: "Takoradi International School",
    image: "/testimonials/abena-koranteng.jpg"
  },
  {
    id: 4,
    content: "The financial management module has helped us maintain transparent records of school fees and expenses. Parents now have more trust in our financial processes.",
    author: "Emmanuel Tetteh",
    position: "School Administrator",
    school: "Hope Academy",
    image: "/testimonials/emmanuel-tetteh.jpg"
  },
  {
    id: 5,
    content: "Since implementing EduTrac, our reporting to the GES has become seamless. What used to take weeks now takes just a few clicks. This system truly understands the Ghanaian education context.",
    author: "Victoria Addo",
    position: "District Education Officer",
    school: "Ghana Education Service",
    image: "/testimonials/victoria-addo.jpg"
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Calculate how many testimonials to show based on viewport
  const [visibleCount, setVisibleCount] = useState(3);
  
  // For use in useEffect if needed to update visibleCount based on window size
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth < 640) {
  //       setVisibleCount(1);
  //     } else if (window.innerWidth < 1024) {
  //       setVisibleCount(2);
  //     } else {
  //       setVisibleCount(3);
  //     }
  //   };
  //   
  //   handleResize();
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  const showNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % (testimonials.length - visibleCount + 1)
    );
  };

  const showPrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 
        ? testimonials.length - visibleCount 
        : prevIndex - 1
    );
  };

  // Get current visible testimonials
  const visibleTestimonials = testimonials.slice(
    currentIndex, 
    currentIndex + visibleCount
  );

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Hear From Our Community
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover how EduTrac is making a difference in schools across Ghana
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center z-10">
            <Button
              onClick={showPrev}
              className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md -ml-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
          
          {/* Testimonials */}
          <div className="overflow-hidden px-8">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(0%)` }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {visibleTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex mb-6">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {testimonial.image ? (
                          <Image 
                            src={testimonial.image} 
                            alt={testimonial.author}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full text-gray-500 dark:text-gray-400 text-lg font-semibold">
                            {testimonial.author.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{testimonial.author}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.position}, {testimonial.school}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center z-10">
            <button
              onClick={showNext}
              className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md -mr-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: testimonials.length - visibleCount + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full ${
                index === currentIndex 
                  ? 'bg-blue-600 w-4' 
                  : 'bg-gray-300 dark:bg-gray-600'
              } transition-all duration-300`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}