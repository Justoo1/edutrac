// components/home/PricingSection.tsx
import { Check } from 'lucide-react';
import Link from 'next/link';

const pricingPlans = [
  {
    name: "Basic",
    description: "Perfect for small schools just getting started",
    price: "GH₵ 150",
    duration: "/month",
    features: [
      "Up to 300 student records",
      "5 staff accounts",
      "Student attendance tracking",
      "Basic reporting",
      "Mobile app access",
      "Email support"
    ],
    cta: "Get Started",
    mostPopular: false,
    color: "bg-white dark:bg-gray-800"
  },
  {
    name: "Standard",
    description: "Ideal for growing schools with additional needs",
    price: "GH₵ 300",
    duration: "/month",
    features: [
      "Up to 800 student records",
      "20 staff accounts",
      "All Basic features",
      "Financial management",
      "Academic performance tracking",
      "Parent portal access",
      "SMS notifications",
      "Priority email support"
    ],
    cta: "Get Started",
    mostPopular: true,
    color: "bg-blue-600 dark:bg-blue-700"
  },
  {
    name: "Premium",
    description: "For large schools needing advanced features",
    price: "GH₵ 500",
    duration: "/month",
    features: [
      "Unlimited student records",
      "Unlimited staff accounts",
      "All Standard features",
      "Advanced analytics & reporting",
      "Curriculum management",
      "Resource inventory tracking",
      "Custom integrations",
      "API access",
      "24/7 priority support"
    ],
    cta: "Get Started",
    mostPopular: false,
    color: "bg-white dark:bg-gray-800"
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your school&apos;s needs, with no hidden fees
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name}
              className={`rounded-2xl shadow-lg overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-xl ${
                plan.mostPopular ? "ring-4 ring-blue-500 dark:ring-blue-400" : ""
              }`}
            >
              <div className={`${
                plan.mostPopular 
                  ? "text-white" 
                  : "text-gray-900 dark:text-white"
                } ${plan.color} p-8`}
              >
                {plan.mostPopular && (
                  <div className="mb-4 inline-block rounded-full bg-blue-200 px-3 py-1 text-xs font-semibold uppercase text-blue-800">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className={`mt-2 ${
                  plan.mostPopular ? "text-blue-100" : "text-gray-500 dark:text-gray-300"
                }`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`ml-1 text-xl font-semibold ${
                    plan.mostPopular ? "text-blue-100" : "text-gray-500 dark:text-gray-300"
                  }`}>
                    {plan.duration}
                  </span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className={`flex-shrink-0 h-6 w-6 ${
                        plan.mostPopular ? "text-blue-500" : "text-green-500"
                      }`} />
                      <span className="ml-3 text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <Link
                    href="/signup"
                    className={`block w-full rounded-md px-4 py-3 text-center text-base font-medium ${
                      plan.mostPopular 
                        ? "bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600"
                        : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                    } shadow-sm`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300"
          >
            Need a custom plan for your district or multiple schools? Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}