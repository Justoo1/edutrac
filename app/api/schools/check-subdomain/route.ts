import { NextResponse } from "next/server";
import db from "@/lib/db";
import { schools } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    // Check if subdomain exists in the database
    const existingSchool = await db.query.schools.findFirst({
      where: eq(schools.subdomain, subdomain.toLowerCase()),
    });

    return NextResponse.json({
      available: !existingSchool,
    });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    return NextResponse.json(
      { error: "Failed to check subdomain availability" },
      { status: 500 }
    );
  }
} 