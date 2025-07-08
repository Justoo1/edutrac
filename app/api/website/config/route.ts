import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { schools, websiteConfigs } from "@/lib/schema";

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

    // Get website configuration
    const config = await db.query.websiteConfigs.findFirst({
      where: eq(websiteConfigs.schoolId, school.id),
      with: {
        theme: true,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching website config:", error);
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
      themeId,
      siteName,
      tagline,
      favicon,
      socialMedia,
      contactInfo,
      globalStyles,
      headerConfig,
      footerConfig,
      navigationMenu,
      seoSettings,
      analytics,
      isMaintenanceMode,
      maintenanceMessage,
      isPublished,
    } = body;

    // Check if config already exists
    const existingConfig = await db.query.websiteConfigs.findFirst({
      where: eq(websiteConfigs.schoolId, school.id),
    });

    let config;
    if (existingConfig) {
      // Update existing configuration
      [config] = await db
        .update(websiteConfigs)
        .set({
          themeId,
          siteName,
          tagline,
          favicon,
          socialMedia,
          contactInfo,
          globalStyles,
          headerConfig,
          footerConfig,
          navigationMenu,
          seoSettings,
          analytics,
          isMaintenanceMode,
          maintenanceMessage,
          isPublished,
          publishedAt: isPublished && !existingConfig.isPublished ? new Date() : existingConfig.publishedAt,
        })
        .where(eq(websiteConfigs.schoolId, school.id))
        .returning();
    } else {
      // Create new configuration
      [config] = await db
        .insert(websiteConfigs)
        .values({
          schoolId: school.id,
          themeId,
          siteName,
          tagline,
          favicon,
          socialMedia,
          contactInfo,
          globalStyles,
          headerConfig,
          footerConfig,
          navigationMenu,
          seoSettings,
          analytics,
          isMaintenanceMode,
          maintenanceMessage,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        })
        .returning();
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error saving website config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
