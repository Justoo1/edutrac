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

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    // Get school information
    const school = await db.query.schools.findFirst({
      where: eq(schools.adminId, session.user.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get blocks for the specific page
    const blocks = await db.query.websiteBlocks.findMany({
      where: and(
        eq(websiteBlocks.pageId, pageId),
        eq(websiteBlocks.schoolId, school.id)
      ),
      orderBy: (blocks, { asc }) => [asc(blocks.sortOrder)],
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Error fetching blocks:", error);
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
      pageId,
      blockType,
      content,
      styles,
      sortOrder,
      isVisible = true,
    } = body;

    // Validate required fields
    if (!pageId || !blockType) {
      return NextResponse.json(
        { error: "Page ID and block type are required" },
        { status: 400 }
      );
    }

    // Verify that the page belongs to the school
    const page = await db.query.websitePages.findFirst({
      where: and(
        eq(websitePages.id, pageId),
        eq(websitePages.schoolId, school.id)
      ),
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Create the new block
    const [newBlock] = await db
      .insert(websiteBlocks)
      .values({
        schoolId: school.id,
        pageId,
        blockType,
        content: content || {},
        styles: styles || {},
        sortOrder: sortOrder || 0,
        isVisible,
      })
      .returning();

    return NextResponse.json({ block: newBlock }, { status: 201 });
  } catch (error) {
    console.error("Error creating block:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      blockId,
      pageId,
      blockType,
      content,
      styles,
      sortOrder,
      isVisible,
    } = body;

    // Validate required fields
    if (!blockId) {
      return NextResponse.json(
        { error: "Block ID is required" },
        { status: 400 }
      );
    }

    // Verify that the block belongs to the school
    const existingBlock = await db.query.websiteBlocks.findFirst({
      where: and(
        eq(websiteBlocks.id, blockId),
        eq(websiteBlocks.schoolId, school.id)
      ),
    });

    if (!existingBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Update the block
    const [updatedBlock] = await db
      .update(websiteBlocks)
      .set({
        pageId: pageId || existingBlock.pageId,
        blockType: blockType || existingBlock.blockType,
        content: content || existingBlock.content,
        styles: styles || existingBlock.styles,
        sortOrder: sortOrder !== undefined ? sortOrder : existingBlock.sortOrder,
        isVisible: isVisible !== undefined ? isVisible : existingBlock.isVisible,
      })
      .where(eq(websiteBlocks.id, blockId))
      .returning();

    return NextResponse.json({ block: updatedBlock });
  } catch (error) {
    console.error("Error updating block:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');
    const pageId = searchParams.get('pageId');

    if (blockId) {
      // Delete a specific block
      const existingBlock = await db.query.websiteBlocks.findFirst({
        where: and(
          eq(websiteBlocks.id, blockId),
          eq(websiteBlocks.schoolId, school.id)
        ),
      });

      if (!existingBlock) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 });
      }

      await db.delete(websiteBlocks).where(eq(websiteBlocks.id, blockId));
      return NextResponse.json({ message: "Block deleted successfully" });
    } else if (pageId) {
      // Delete all blocks for a page
      const page = await db.query.websitePages.findFirst({
        where: and(
          eq(websitePages.id, pageId),
          eq(websitePages.schoolId, school.id)
        ),
      });

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      await db.delete(websiteBlocks).where(
        and(
          eq(websiteBlocks.pageId, pageId),
          eq(websiteBlocks.schoolId, school.id)
        )
      );
      return NextResponse.json({ message: "All blocks deleted successfully" });
    } else {
      return NextResponse.json(
        { error: "Block ID or Page ID is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting block(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
