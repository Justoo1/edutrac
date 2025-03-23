import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { type SelectSchool } from "@/lib/schema";

export default function SchoolFooter({ 
  school, 
  domain 
}: { 
  school: SelectSchool; 
  domain: string;
}) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* School Info */}
          <div>
            <h3 className="text-lg font-bold">{school.name}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {school.description || "Providing quality education for children in Ghana."}
            </p>
            <div className="mt-4 flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link 
                  href={`/${domain}/about`}
                  className="text-gray-400 hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/academics`}
                  className="text-gray-400 hover:text-white"
                >
                  Academics
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/admissions`}
                  className="text-gray-400 hover:text-white"
                >
                  Admissions
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/faculty`}
                  className="text-gray-400 hover:text-white"
                >
                  Faculty & Staff
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/calendar`}
                  className="text-gray-400 hover:text-white"
                >
                  School Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-base font-semibold">Resources</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link 
                  href={`/${domain}/announcements`}
                  className="text-gray-400 hover:text-white"
                >
                  Announcements
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/events`}
                  className="text-gray-400 hover:text-white"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/gallery`}
                  className="text-gray-400 hover:text-white"
                >
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${domain}/resources`}
                  className="text-gray-400 hover:text-white"
                >
                  Student Resources
                </Link>
              </li>
              <li>
                <Link 
                  href="/login"
                  className="text-gray-400 hover:text-white"
                >
                  Parent/Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-base font-semibold">Contact Us</h4>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span className="text-gray-400">
                  {school.address || "123 School Street"}<br />
                  {school.district || "East Legon"}<br />
                  {school.region || "Greater Accra"}, Ghana
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5 text-gray-400" />
                <span className="text-gray-400">{school.phone || "+233 20 123 4567"}</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-gray-400" />
                <a 
                  href={`mailto:${school.email || `info@${domain}`}`}
                  className="text-gray-400 hover:text-white"
                >
                  {school.email || `info@${domain}`}
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} {school.name}. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 text-sm text-gray-400">
            Powered by <a href="https://edutrac.com" className="hover:text-white">EduTrac</a>
          </p>
        </div>
      </div>
    </footer>
  );
}