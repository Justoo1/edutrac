import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { schools, websitePages, websiteBlocks } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get all pages for the school
    let pages = await db.query.websitePages.findMany({
      where: eq(websitePages.schoolId, school.id),
      with: {
        blocks: {
          orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
        },
      },
      orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
    });

    // If no pages exist, create default pages
    if (pages.length === 0) {
      await createDefaultPages(school.id, session.user.id);
      // Fetch again with blocks
      pages = await db.query.websitePages.findMany({
        where: eq(websitePages.schoolId, school.id),
        with: {
          blocks: {
            orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
          },
        },
        orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
      });
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      pageType = "page",
      isHomePage = false,
      showInNavigation = true,
      accessLevel = "public",
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists for this school
    const existingPage = await db.query.websitePages.findFirst({
      where: and(
        eq(websitePages.schoolId, school.id),
        eq(websitePages.slug, slug)
      ),
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    // If this is set as home page, update existing home page
    if (isHomePage) {
      await db
        .update(websitePages)
        .set({ isHomePage: false })
        .where(
          and(
            eq(websitePages.schoolId, school.id),
            eq(websitePages.isHomePage, true)
          )
        );
    }

    // Create the new page
    const [newPage] = await db
      .insert(websitePages)
      .values({
        schoolId: school.id,
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        pageType,
        isHomePage,
        showInNavigation,
        accessLevel,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createDefaultPages(schoolId: string, userId: string) {
  const defaultPages = [
    {
      schoolId,
      title: "Home",
      slug: "/",
      metaTitle: "Welcome to Our School",
      metaDescription: "Discover quality education at our institution",
      pageType: "landing",
      isHomePage: true,
      isPublished: true,
      showInNavigation: true,
      accessLevel: "public",
      createdBy: userId,
      content: {
        blocks: [
          {
            id: "hero-1",
            type: "hero",
            content: {
              title: "Welcome to Our School",
              subtitle: "Providing quality education for tomorrow's leaders",
              buttonText: "Learn More"
            },
            styles: {},
            sortOrder: 0
          }
        ]
      }
    },
    {
      schoolId,
      title: "About Us",
      slug: "/about",
      metaTitle: "About Our School - History & Mission",
      metaDescription: "Learn about our school's history, mission, and values",
      pageType: "page",
      isHomePage: false,
      isPublished: true,
      showInNavigation: true,
      accessLevel: "public",
      createdBy: userId,
      content: {
        blocks: [
          {
            id: "text-1",
            type: "text",
            content: {
              html: "<h2>About Our School</h2><p>Learn about our school's history, mission, and values.</p>"
            },
            styles: {},
            sortOrder: 0
          }
        ]
      }
    },
    {
      schoolId,
      title: "Admissions",
      slug: "/admissions",
      pageType: "page",
      isHomePage: false,
      isPublished: false,
      showInNavigation: true,
      accessLevel: "public",
      createdBy: userId,
      content: { blocks: [] }
    }
  ];

  const createdPages = await db.insert(websitePages).values(defaultPages).returning();
  
  // Create blocks for each page
  for (const page of createdPages) {
  const pageContent = defaultPages.find(p => p.slug === page.slug);
  if (pageContent?.content?.blocks && pageContent.content.blocks.length > 0) {
    await db.insert(websiteBlocks).values(
      pageContent.content.blocks.map((block: any) => ({
        pageId: page.id,
        schoolId,
        blockType: block.type,
        content: block.content,
        styles: block.styles,
        sortOrder: block.sortOrder,
      }))
    );
  }
}

  return createdPages;
}