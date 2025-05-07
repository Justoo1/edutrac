"use server"

// lib/jobs/updateExamStatus.ts
import { eq, and, or, sql } from "drizzle-orm";
import db from "@/lib/db";
import { exams } from "@/lib/schema";

/**
 * Updates exam statuses based on their scheduled times
 * This function should be run periodically (e.g., every 5-15 minutes)
 */
export async function updateExamStatuses() {
  try {
    const now = new Date();
    
    // Format just the date part for today (YYYY-MM-DD)
    const todayDate = now.toISOString().split('T')[0];
    
    // Get today's exams that are scheduled
    const todaysExams = await db.query.exams.findMany({
      where: and(
        or(eq(exams.status, "scheduled"), eq(exams.status, "draft")),
        // Use SQL to cast and format the date for comparison
        sql`CAST(${exams.examDate} AS TEXT) LIKE ${todayDate + '%'}`
      ),
    });

    // Process each exam and update status if needed
    for (const exam of todaysExams) {
      // Skip if missing critical timing data
      if (!exam.examDate || !exam.duration) continue;
      
      const examDate = new Date(exam.examDate);
      
      // Extract hours and minutes from start time fields
      // Assuming your schema has startTime and endTime fields or equivalent
      let startHour = 0;
      let startMinute = 0;
      
      // Check if startTime exists (adapt based on your actual schema)
      if (exam.startTime) {
        const [hours, minutes] = exam.startTime.split(':').map(Number);
        startHour = hours || 0;
        startMinute = minutes || 0;
      }
      
      // Set the start time on the exam date
      const examStartTime = new Date(examDate);
      examStartTime.setHours(startHour, startMinute, 0, 0);
      
      // Calculate end time based on duration (in minutes)
      const examEndTime = new Date(examStartTime);
      examEndTime.setMinutes(examStartTime.getMinutes() + exam.duration);
      
      // Check if current time is within exam period
      if (now >= examStartTime && now <= examEndTime) {
        // Update exam status to "in progress"
        await db
          .update(exams)
          .set({ 
            status: "in progress", 
            updatedAt: new Date() 
          })
          .where(eq(exams.id, exam.id));
          
        console.log(`Updated exam ${exam.id} (${exam.name}) status to "in progress"`);
      } 
      // Check if exam has ended
      else if (now > examEndTime) {
        // Update exam status to "completed" if it's not already
        if (exam.status !== "completed" && exam.status !== "graded" && exam.status !== "published") {
          await db
            .update(exams)
            .set({ 
              status: "completed", 
              updatedAt: new Date() 
            })
            .where(eq(exams.id, exam.id));
            
          console.log(`Updated exam ${exam.id} (${exam.name}) status to "completed"`);
        }
      }
    }
    
    console.log(`Exam status update job completed at ${new Date().toISOString()}`);
    return { success: true, updatedCount: todaysExams.length };
  } catch (error) {
    console.error("Error updating exam statuses:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}