// lib/scheduler.ts
import { updateExamStatuses } from "./jobs/updatExamStatus";

export function initExamStatusScheduler() {
  // Check every 5 minutes (5 * 60 * 1000 milliseconds)
//   const CHECK_INTERVAL = 5 * 60 * 1000;
  
  // Run immediately once on startup
  updateExamStatuses().catch(err => console.error("Initial exam status update failed:", err));
  
//   // Then set up the interval for periodic checks
//   const intervalId = setInterval(async () => {
//     try {
//       await updateExamStatuses();
//     } catch (error) {
//       console.error("Scheduled exam status update failed:", error);
//     }
//   }, CHECK_INTERVAL);
  
//   // Return the interval ID so it can be cleared if needed
//   return intervalId;
}