import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { schoolContent, schools } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, content, contentType, schoolId, slug } = body;

    // Validate required fields
    if (!title || !content || !contentType || !schoolId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Sanitize content before saving
    const sanitizedContent = DOMPurify.sanitize(content);

    // Create the content
    const newContent = await db
      .insert(schoolContent)
      .values({
        title,
        description,
        content: sanitizedContent,
        contentType,
        schoolId,
        slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        authorId: session.user.id,
        published: true,
        publishDate: new Date(),
      })
      .returning();

    // Revalidate the cache
    revalidateTag(`${school.subdomain}-${contentType}`);

    return NextResponse.json(newContent[0]);
  } catch (error) {
    console.error("[SCHOOL_CONTENT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const contentType = searchParams.get("contentType");

    if (!schoolId) {
      return new NextResponse("School ID is required", { status: 400 });
    }

    // Check if user has access to this school
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });

    if (!school || school.adminId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get content for the school
    const content = await db.query.schoolContent.findMany({
      where: (schoolContent, { eq, and }) => {
        const conditions = [eq(schoolContent.schoolId, schoolId)];
        if (contentType) {
          conditions.push(eq(schoolContent.contentType, contentType));
        }
        return and(...conditions);
      },
      orderBy: (schoolContent, { desc }) => [desc(schoolContent.publishDate || schoolContent.createdAt)],
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error("[SCHOOL_CONTENT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 