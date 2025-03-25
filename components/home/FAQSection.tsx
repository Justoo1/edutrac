// components/home/FAQSection.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: "How does EduTrac work with limited internet connectivity?",
    answer: "EduTrac features offline capabilities that allow schools to work without continuous internet connectivity. Data is stored locally and automatically syncs when connection is available. Key features like attendance, grading, and basic records management work fully offline."
  },
  {
    question: "Is EduTrac compliant with Ghana Education Service requirements?",
    answer: "Yes, EduTrac is designed specifically to meet GES requirements. Our system generates all required reports in GES-approved formats, and we regularly update the platform to stay in compliance with any new regulations or reporting requirements."
  },
  {
    question: "How long does it take to implement EduTrac at a school?",
    answer: "A basic implementation typically takes 2-4 weeks, including data migration, setup, and staff training. For larger schools or those requiring extensive customization, implementation might take 4-6 weeks. Our dedicated team supports you throughout the entire process."
  },
  {
    question: "Can parents access their children's information?",
    answer: "Yes, EduTrac includes a parent portal that allows parents to view their children's academic progress, attendance records, fee statements, and school announcements. Parents can also communicate directly with teachers through the system."
  },
  {
    question: "How do you ensure data security and privacy?",
    answer: "We employ industry-standard encryption for all data, both in transit and at rest. Our system includes role-based access controls, ensuring users can only access information relevant to their role. All data is backed up regularly and stored securely in compliance with data protection regulations."
  },
  {
    question: "Does EduTrac work for both public and private schools?",
    answer: "Absolutely! EduTrac is designed to serve all types of schools in Ghana. While public schools benefit from our GES reporting capabilities, private schools appreciate the flexibility to customize certain features while still maintaining alignment with national educational standards."
  },
  {
    question: "What payment methods are supported for fee collection?",
    answer: "EduTrac integrates with popular Ghanaian payment methods including Mobile Money services (MTN MoMo, Vodafone Cash, AirtelTigo Money), bank transfers, and traditional cash payments that can be recorded in the system. We're continuously adding more payment integrations."
  },
  {
    question: "Is there training for school staff to use the system?",
    answer: "Yes, our implementation includes comprehensive training for administrators, teachers, and support staff. We offer both in-person and virtual training sessions, along with detailed documentation and video tutorials accessible within the platform."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know about EduTrac
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                className="flex justify-between items-center w-full px-6 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                <span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </span>
              </button>
              
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Still have questions? We're here to help.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Contact Our Support Team
          </Link>
        </div>
      </div>
    </section>
  );
}