import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import Image from "next/image";
import { redirect } from "next/navigation";
import SiteCard from "./site-card";
import { eq } from "drizzle-orm";
import { schoolContent, SelectSchool } from "@/lib/schema";

export default async function Sites({ website }: { website: SelectSchool }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // const contents = await db.query.schoolContent.findMany({
  //   where: eq(schoolContent.schoolId, siteId),
  //   orderBy: (schoolContent, { desc }) => [desc(schoolContent.createdAt)],
  // });

  return website ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SiteCard data={website} />
      {/* {contents.map((content) => (
      ))} */}
    </div>
  ) : (
    <div className="mt-20 flex flex-col items-center space-x-4">
      <h1 className="font-cal text-4xl">No Content Yet</h1>
      <Image
        alt="missing content"
        src="https://illustrations.popsy.co/gray/web-design.svg"
        width={400}
        height={400}
      />
      <p className="text-lg text-stone-500">
        You do not have any content yet. Create one to get started.
      </p>
    </div>
  );
}
