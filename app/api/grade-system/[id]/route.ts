import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { gradeSystem } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// PUT: Update an existing grade setting
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id: idParam } =  await params; // Rename to avoid clash
      if (!idParam) {
        return NextResponse.json({ error: "Grade ID is required" }, { status: 400 });
      }

      // Convert idParam to number
      const id = parseInt(idParam);
      if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid Grade ID format" }, { status: 400 });
      }

      const body = await req.json();
      const { schoolId, gradeName, minScore, maxScore, interpretation, gradePoint } = body;
  
      if (!schoolId || !gradeName || minScore === undefined || maxScore === undefined) {
          return NextResponse.json(
              { error: "Missing required fields" },
              { status: 400 }
          );
      }
  
      // Basic validation
      if (minScore > maxScore) {
          return NextResponse.json(
              { error: "Minimum score cannot be greater than maximum score" },
              { status: 400 }
          );
      }
  
      // Check if the record exists and belongs to the school
      const existingGrade = await db.query.gradeSystem.findFirst({
        where: and(eq(gradeSystem.id, id), eq(gradeSystem.schoolId, schoolId))
      });
  
      if (!existingGrade) {
          return NextResponse.json({ error: "Grade setting not found or unauthorized" }, { status: 404 });
      }
  
      const [updatedGrade] = await db
        .update(gradeSystem)
        .set({
          gradeName: gradeName,
          minScore: minScore,
          maxScore: maxScore,
          interpretation,
          gradePoint: gradePoint ? gradePoint.toString() : null,
          updatedAt: new Date(),
        })
        .where(eq(gradeSystem.id, id))
        .returning();
  
      return NextResponse.json(updatedGrade);
    } catch (error) {
      console.error("[GRADE_SYSTEM_PUT]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
  
  // DELETE: Delete a grade setting
  export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
      try {
          const session = await getSession();
          if (!session) {
              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (session.user.role !== "admin") {
              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
          const { id: idParam } =  await params; // Rename to avoid clash
          if (!idParam) {
            return NextResponse.json({ error: "Grade ID is required" }, { status: 400 });
          }
            
            const schoolId = session.user.schoolId; // Ensure deletion is scoped to school
            if (!schoolId) {
              return NextResponse.json({ error: "School ID is required" }, { status: 400 });
            }
  
          // Convert id to number
          const gradeId = parseInt(idParam);
          if (isNaN(gradeId)) {
              return NextResponse.json({ error: "Invalid Grade ID" }, { status: 400 });
          }
  
          // Verify ownership before deleting
          const existingGrade = await db.query.gradeSystem.findFirst({
              where: and(eq(gradeSystem.id, gradeId), eq(gradeSystem.schoolId, schoolId))
          });
  
          if (!existingGrade) {
              return NextResponse.json({ error: "Grade setting not found or unauthorized" }, { status: 404 });
          }
  
          await db.delete(gradeSystem).where(eq(gradeSystem.id, gradeId));
  
          return NextResponse.json({ message: "Grade setting deleted successfully" });
      } catch (error) {
          console.error("[GRADE_SYSTEM_DELETE]", error);
          return NextResponse.json(
              { error: "Internal server error" },
              { status: 500 }
          );
      }
  } 