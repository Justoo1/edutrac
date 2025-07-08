import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { schools, websitePages, websiteBlocks } from "@/lib/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id:pageId} = await params;

    // Get school information
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get the specific page with its blocks
    const page = await db.query.websitePages.findFirst({
      where: and(
        eq(websitePages.id, pageId),
        eq(websitePages.schoolId, school.id)
      ),
      with: {
        blocks: {
          orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }


    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id:pageId} = await params;

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
      pageType,
      isHomePage,
      isPublished,
      showInNavigation,
      accessLevel,
      blocks,
    } = body;

    // Check if page exists and belongs to the school
    const existingPage = await db.query.websitePages.findFirst({
      where: and(
        eq(websitePages.id, pageId),
        eq(websitePages.schoolId, school.id)
      ),
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existingPage.slug) {
      const conflictingPage = await db.query.websitePages.findFirst({
        where: and(
          eq(websitePages.schoolId, school.id),
          eq(websitePages.slug, slug)
        ),
      });

      if (conflictingPage) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // If setting as home page, update existing home page
    if (isHomePage && !existingPage.isHomePage) {
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

    // Update the page
    const [updatedPage] = await db
      .update(websitePages)
      .set({
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        pageType,
        isHomePage,
        isPublished,
        showInNavigation,
        accessLevel,
        publishedAt: isPublished && !existingPage.isPublished ? new Date() : existingPage.publishedAt,
      })
      .where(eq(websitePages.id, pageId))
      .returning();

    // Update blocks if provided
    if (blocks && Array.isArray(blocks)) {
      // Delete existing blocks
      await db.delete(websiteBlocks).where(eq(websiteBlocks.pageId, pageId));

      // Insert new blocks
      if (blocks.length > 0) {
        await db.insert(websiteBlocks).values(
          blocks.map((block: any, index: number) => ({
            pageId,
            schoolId: school.id,
            blockType: block.type,
            content: block.content,
            styles: block.styles,
            sortOrder: index,
          }))
        );
      }
    }

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id:pageId} = await params;

    // Get school information
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if page exists and belongs to the school
    const existingPage = await db.query.websitePages.findFirst({
      where: and(
        eq(websitePages.id, pageId),
        eq(websitePages.schoolId, school.id)
      ),
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Prevent deletion of home page
    if (existingPage.isHomePage) {
      return NextResponse.json(
        { error: "Cannot delete the home page" },
        { status: 400 }
      );
    }

    // Delete the page (blocks will be cascade deleted)
    await db.delete(websitePages).where(eq(websitePages.id, pageId));

    return NextResponse.json({ message: "Page deleted successfully" });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
