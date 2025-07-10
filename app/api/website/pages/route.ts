import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { schools, websitePages, websiteBlocks } from "@/lib/schema";


interface Block {
  pageId: string;
  schoolId: string;
  blockType: string;
  content: object;
  styles: object;
  sortOrder: number;
  isVisible: boolean;
}

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
    const schoolId = session.user.schoolId;

    if (!schoolId) {
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
        eq(websitePages.schoolId, schoolId),
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
            eq(websitePages.schoolId, schoolId),
            eq(websitePages.isHomePage, true)
          )
        );
    }

    // Create the new page
    const [newPage] = await db
      .insert(websitePages)
      .values({
        schoolId: schoolId,
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
      content: {}, // Empty content, blocks will be created separately
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
      content: {}, // Empty content, blocks will be created separately
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
      content: {}, // Empty content, blocks will be created separately
    }
  ];

  // Insert pages first
  const createdPages = await db.insert(websitePages).values(defaultPages).returning();
  
  // Then create blocks for each page
  for (const page of createdPages) {
    let blocksToCreate: Block[] = [];
    
    if (page.slug === "/") {
      // Home page blocks
      blocksToCreate = [
        {
          pageId: page.id,
          schoolId,
          blockType: "hero-welcome",
          content: {
            title: "Welcome to Our School",
            subtitle: "Providing quality education for tomorrow's leaders",
            description: "We provide quality education that prepares students for success in an ever-changing world.",
            buttonText: "Learn More",
            buttonUrl: "/about",
            backgroundImage: "",
            backgroundColor: "#1e40af"
          },
          styles: {
            textAlign: "center",
            padding: "4rem 2rem",
            color: "white"
          },
          sortOrder: 0,
          isVisible: true,
        }
      ];
    } else if (page.slug === "/about") {
      // About page blocks
      blocksToCreate = [
        {
          pageId: page.id,
          schoolId,
          blockType: "text",
          content: {
            html: "<h2>About Our School</h2><p>Learn about our school's history, mission, and values. We are committed to providing quality education and nurturing the next generation of leaders.</p>"
          },
          styles: {
            padding: "2rem",
            maxWidth: "800px",
            margin: "0 auto"
          },
          sortOrder: 0,
          isVisible: true,
        }
      ];
    }

    // Insert blocks if there are any
    if (blocksToCreate.length > 0) {
      await db.insert(websiteBlocks).values(blocksToCreate);
    }
  }

  return createdPages;
}
