import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSchoolData, getContentForSchool } from "@/lib/fetchers";
import BlurImage from "@/components/blur-image";
import { placeholderBlurhash, toDateString } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const paramData = await params
  const domain = decodeURIComponent(paramData.domain);
  
  const data = await getSchoolData(domain);
  if (!data) {
    return null;
  }
  const {
    name: title,
    description,
    image,
    logo,
  } = data as {
    name: string;
    description: string;
    image: string;
    logo: string;
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@edutrac",
    },
    icons: [logo],
    metadataBase: new URL(`https://${domain}`),
  };
}

export default async function SchoolHomePage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const paramData = await params
  console.log({paramData})
  const domain = decodeURIComponent(paramData.domain);
  const [schoolData, announcements] = await Promise.all([
    getSchoolData(domain),
    getContentForSchool(domain, "announcement"),
  ]);

  if (!schoolData) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 w-full overflow-hidden">
        <BlurImage
          alt={schoolData.name}
          blurDataURL={schoolData.imageBlurhash ?? placeholderBlurhash}
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
          placeholder="blur"
          src={schoolData.image ?? "/school-placeholder.jpg"}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {schoolData.name}
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              {schoolData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      {/* <div className="bg-blue-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-center items-center md:space-x-8 space-y-2 md:space-y-0">
            <Link href="/academics" className="hover:underline font-medium">
              Academics
            </Link>
            <Link href="/admissions" className="hover:underline font-medium">
              Admissions
            </Link>
            <Link href="/faculty" className="hover:underline font-medium">
              Faculty & Staff
            </Link>
            <Link href="/calendar" className="hover:underline font-medium">
              School Calendar
            </Link>
            <Link href="/contact" className="hover:underline font-medium">
              Contact Us
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-4 py-1 rounded font-medium hover:bg-blue-50"
            >
              Parent/Staff Login
            </Link>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - 2/3 width on large screens */}
            <div className="lg:col-span-2">
              {/* Welcome Message */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome to {schoolData.name}</h2>
                <div className="prose max-w-none">
                  <p>
                    {schoolData.description || `Welcome to ${schoolData.name}, where we are committed to providing a nurturing and stimulating environment for our students to learn and grow. Our dedicated staff works tirelessly to ensure that each child receives a quality education that prepares them for future success.`}
                  </p>
                  <p>
                    We believe in developing the whole child - intellectually, socially, emotionally, and physically. Our curriculum is designed to challenge students while also fostering creativity, critical thinking, and a love of learning.
                  </p>
                </div>
                <div className="mt-6">
                  <Link 
                    href="/about"
                    className="text-blue-600 font-medium hover:text-blue-800 transition"
                  >
                    Learn more about our school →
                  </Link>
                </div>
              </div>

              {/* Latest Announcements */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Announcements</h2>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-8">
                    {announcements.slice(0, 3).map((announcement) => (
                      <div 
                        key={announcement.id} 
                        className="border-b border-gray-200 pb-6 last:border-0"
                      >
                        <h3 className="text-xl font-bold mb-2">
                          <Link 
                            href={`/announcements/${announcement.slug}`}
                            className="text-gray-900 hover:text-blue-600 transition"
                          >
                            {announcement.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {toDateString(announcement.publishDate || announcement.createdAt)}
                        </p>
                        <p className="text-gray-600 mb-4">{announcement.description}</p>
                        <Link 
                          href={`/announcements/${announcement.slug}`}
                          className="text-blue-600 font-medium hover:text-blue-800 transition"
                        >
                          Read more →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No announcements at this time.</p>
                  </div>
                )}
                {announcements && announcements.length > 3 && (
                  <div className="mt-8 text-center">
                    <Link
                      href="/announcements"
                      className="inline-block bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition"
                    >
                      View All Announcements
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - 1/3 width on large screens */}
            <div className="space-y-8">
              {/* School Info Card */}
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">School Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-700">{schoolData.address || "123 School Street, Accra, Ghana"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-700">{schoolData.phone || "+233 20 123 4567"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-700">{schoolData.email || "info@" + domain}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">School Type</p>
                    <p className="text-gray-700">{schoolData.schoolType || "Primary and Junior High School"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Established</p>
                    <p className="text-gray-700">{schoolData.establishedYear || "1995"}</p>
                  </div>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/admissions" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → Admissions Information
                  </Link>
                  <Link href="/calendar" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → Academic Calendar
                  </Link>
                  <Link href="/curriculum" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → Curriculum Guide
                  </Link>
                  <Link href="/staff" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → Faculty & Staff Directory
                  </Link>
                  <Link href="/facilities" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → School Facilities
                  </Link>
                  <Link href="/policies" className="block text-blue-600 hover:text-blue-800 transition py-1">
                    → School Policies
                  </Link>
                </div>
              </div>

              {/* Upcoming Events Card */}
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Parent-Teacher Conference</p>
                    <p className="text-sm text-gray-500">March 25, 2023</p>
                  </div>
                  <div>
                    <p className="font-medium">Sports Day</p>
                    <p className="text-sm text-gray-500">April 10, 2023</p>
                  </div>
                  <div>
                    <p className="font-medium">Science Fair</p>
                    <p className="text-sm text-gray-500">April 22, 2023</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/events"
                    className="text-blue-600 font-medium hover:text-blue-800 transition"
                  >
                    View all events →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials/Success Stories */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Our Community Says</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  P
                </div>
                <div className="ml-4">
                  <p className="font-bold">Parent</p>
                  <p className="text-sm text-gray-500">Mother of P5 student</p>
                </div>
              </div>
              <p className="italic text-gray-600">
                &quot;The teachers at this school have been absolutely amazing. My child has grown so much academically and personally since enrolling here.&quot;
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
                  S
                </div>
                <div className="ml-4">
                  <p className="font-bold">Student</p>
                  <p className="text-sm text-gray-500">JHS 3 Graduate</p>
                </div>
              </div>
              <p className="italic text-gray-600">
                &#34;I loved my time at this school. The teachers were supportive and I made lifelong friends. I&apos;m well-prepared for senior high school thanks to the education I received here.&quot;
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                  T
                </div>
                <div className="ml-4">
                  <p className="font-bold">Teacher</p>
                  <p className="text-sm text-gray-500">10 years at the school</p>
                </div>
              </div>
              <p className="italic text-gray-600">
                &quot;Working at this school has been a rewarding experience. We have a collaborative staff and administration that truly puts students first.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with school-specific info */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{schoolData.name}</h3>
              <p className="text-gray-400 mb-4">
                Providing quality education for children in Ghana.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/admissions" className="text-gray-400 hover:text-white">Admissions</Link></li>
                <li><Link href="/academics" className="text-gray-400 hover:text-white">Academics</Link></li>
                <li><Link href="/staff" className="text-gray-400 hover:text-white">Faculty & Staff</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/calendar" className="text-gray-400 hover:text-white">School Calendar</Link></li>
                <li><Link href="/library" className="text-gray-400 hover:text-white">Library</Link></li>
                <li><Link href="/handbook" className="text-gray-400 hover:text-white">Student Handbook</Link></li>
                <li><Link href="/facilities" className="text-gray-400 hover:text-white">Facilities</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <address className="not-italic text-gray-400">
                <p>{schoolData.address || "123 School Street"}</p>
                <p>{schoolData.district || "East Legon"}</p>
                <p>{schoolData.region || "Greater Accra"}, Ghana</p>
                <p className="mt-2">Phone: {schoolData.phone || "+233 20 123 4567"}</p>
                <p>Email: {schoolData.email || "info@" + domain}</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} {schoolData.name}. All rights reserved.</p>
            <p className="text-gray-400 mt-4 md:mt-0">Powered by <a href="https://edutrac.com" className="hover:text-white">EduTrac</a></p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}