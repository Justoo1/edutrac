import { Suspense } from "react";
import Sites from "@/components/sites";
import PlaceholderCard from "@/components/placeholder-card";
import CreateSiteButton from "@/components/create-site-button";
import CreateSiteModal from "@/components/modal/create-site";
import { getSchoolPlanAndSiteCount } from "@/lib/actions";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { schools } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// Add this interface for plan limits
interface PlanLimits {
  free: number;
  basic: number;
  pro: number;
  premium: number;
}

export default async function AllSites() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const userSchools = await db.query.schools.findMany({
    where: eq(schools.adminId, session.user.id),
    orderBy: (schools, { asc }) => [asc(schools.createdAt)],
  });

  // Get plan info for each school
  const schoolsWithPlanInfo = await Promise.all(
    userSchools.map(async (school) => {
      const planInfo = await getSchoolPlanAndSiteCount(school.id);
      return {
        ...school,
        siteCount: planInfo?.siteCount || 0,
      };
    })
  );

  const planLimits: PlanLimits = {
    free: 0,
    basic: 1,
    pro: 3,
    premium: 10
  };

  return (
    <div className="flex max-w-screen-xl flex-col space-y-12 p-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cal text-3xl font-bold dark:text-white">
            All Sites
          </h1>
          {schoolsWithPlanInfo.length > 0 ? (
            schoolsWithPlanInfo.map((school) => {
              const canCreateSite = school.siteCount < planLimits[school.plan as keyof PlanLimits];
              return (
                <div key={school.id}>
                  {canCreateSite ? (
                    <CreateSiteButton>
                      <CreateSiteModal />
                    </CreateSiteButton>
                  ) : (
                    <div className="text-sm text-red-500">
                      {school.plan === 'free' ? (
                        <p>Please upgrade your plan to create websites</p>
                      ) : (
                        <p>You have reached the maximum number of sites ({planLimits[school.plan as keyof PlanLimits]}) for your {school.plan} plan</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })[0]
          ) : (
            <div className="text-sm text-red-500">
              <p>Please create a school first</p>
            </div>
          )}
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PlaceholderCard key={i} />
              ))}
            </div>
          }
        >
          <div className="">
            {schoolsWithPlanInfo.map((school) => (
              // <div key={school.id} className="group relative rounded-lg border p-6 w-72 hover:border-black dark:hover:border-white">
              //   <div className="flex items-center justify-between">
              //     <div>
              //       <h2 className="font-cal text-xl text-red-200">{school.name}</h2>
              //       <p className="text-sm text-gray-100">{school.subdomain}.edutrac.com</p>
              //     </div>
              //   </div>
              //   <div className="mt-4">
              //     <p className="text-sm text-gray-100">{school.description || "No description"}</p>
              //   </div>
              //   <div className="mt-4 flex items-center justify-between">
              //     <span className="text-sm text-gray-100">
              //       Plan: {school.plan} ({school.siteCount}/{planLimits[school.plan as keyof PlanLimits]} sites)
              //     </span>
              //     <a
              //       href={`/school/${school.id}`}
              //       className="text-sm font-medium text-black hover:underline dark:text-white"
              //     >
              //       View Details →
              //     </a>
              //   </div>
              // </div>
              <Sites website={school} key={school.id} />
            ))}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
