import React from "react";
import { BlockType } from "./types";
import { MessageSquare, Mail, Phone, MapPin, Send, Star, Users, Heart } from "lucide-react";

// Contact Form Block Component
export const ContactFormBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Contact Us", subtitle = "Get in touch with us" } = block.content || {};
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Phone</h4>
                    <p className="text-gray-600">+233 123 456 789</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Email</h4>
                    <p className="text-gray-600">info@school.edu.gh</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-gray-600">123 Education Street, Accra, Ghana</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>General Inquiry</option>
                    <option>Admissions</option>
                    <option>Academic Programs</option>
                    <option>Student Services</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your message..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Newsletter Signup Block Component
export const NewsletterSignupBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Stay Updated", subtitle = "Subscribe to our newsletter for latest updates" } = block.content || {};
  
  return (
    <section className="py-12 bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-blue-100 mb-8">{subtitle}</p>
          
          <div className="bg-white rounded-lg p-6">
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your email address"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Subscribe
              </button>
            </form>
            <p className="text-gray-600 text-sm mt-4">
              We respect your privacy. No spam, just updates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Live Chat Block Component
export const LiveChatBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Need Help?", subtitle = "Chat with us for instant support" } = block.content || {};
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">School Support</h3>
                  <p className="text-blue-100 text-sm">We&apos;re here to help</p>
                </div>
                <div className="ml-auto">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="p-6 h-64 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-800">Hello! How can we help you today?</p>
                    <span className="text-xs text-gray-500">Support Team • Just now</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your message..."
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Feedback Form Block Component
export const FeedbackFormBlock: React.FC<{ block: any }> = ({ block }) => {
  const { title = "Share Your Feedback", subtitle = "Help us improve our services" } = block.content || {};
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border p-8">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="text-yellow-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Select Category</option>
                  <option>Teaching Quality</option>
                  <option>Facilities</option>
                  <option>Communication</option>
                  <option>Administration</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Share your thoughts and suggestions..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Block Type Definitions
export const INTERACTIVE_BLOCKS: BlockType[] = [
  {
    type: "contact-form",
    label: "Contact Form",
    description: "Allow visitors to contact the school",
    category: "Interactive",
    icon: Mail,
    defaultContent: {
      title: "Contact Us",
      subtitle: "Get in touch with us"
    }
  },
  {
    type: "newsletter-signup",
    label: "Newsletter Signup",
    description: "Collect email addresses for newsletters",
    category: "Interactive",
    icon: Send,
    defaultContent: {
      title: "Stay Updated",
      subtitle: "Subscribe to our newsletter for latest updates"
    }
  },
  {
    type: "live-chat",
    label: "Live Chat",
    description: "Enable real-time communication with visitors",
    category: "Interactive",
    icon: MessageSquare,
    defaultContent: {
      title: "Need Help?",
      subtitle: "Chat with us for instant support"
    }
  },
  {
    type: "feedback-form",
    label: "Feedback Form",
    description: "Collect feedback and ratings from users",
    category: "Interactive",
    icon: Star,
    defaultContent: {
      title: "Share Your Feedback",
      subtitle: "Help us improve our services"
    }
  }
];

// Get default content function
export const getInteractiveDefaultContent = (type: string) => {
  const block = INTERACTIVE_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
