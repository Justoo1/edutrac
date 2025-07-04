// Test file to verify the reports API is working
// You can run this in your browser console or create a simple test page

async function testReportsAPI() {
  const schoolId = "test-school"; // Replace with your actual school ID
  const baseUrl = `/api/finance/reports-data?schoolId=${schoolId}`;
  
  // Test 1: Current month, all data
  console.log("=== Test 1: Current month, all data ===");
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const params1 = new URLSearchParams({
      startDate,
      endDate,
      includeExpenses: "true",
      includeFees: "true",
      reportType: "all"
    });
    
    const response1 = await fetch(`${baseUrl}&${params1.toString()}`);
    const data1 = await response1.json();
    
    console.log("Current month data:", data1);
    console.log("Has data:", data1.hasData);
    console.log("Total revenue:", data1.totalRevenue);
    console.log("Total expenses:", data1.totalExpenses);
    
  } catch (error) {
    console.error("Test 1 failed:", error);
  }
  
  // Test 2: Fees only
  console.log("\\n=== Test 2: Fees only ===");
  try {
    const params2 = new URLSearchParams({
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      includeExpenses: "false",
      includeFees: "true",
      reportType: "fees"
    });
    
    const response2 = await fetch(`${baseUrl}&${params2.toString()}`);
    const data2 = await response2.json();
    
    console.log("Fees only data:", data2);
    console.log("Revenue (should have data):", data2.totalRevenue);
    console.log("Expenses (should be 0):", data2.totalExpenses);
    
  } catch (error) {
    console.error("Test 2 failed:", error);
  }
  
  // Test 3: Expenses only
  console.log("\\n=== Test 3: Expenses only ===");
  try {
    const params3 = new URLSearchParams({
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      includeExpenses: "true",
      includeFees: "false",
      reportType: "expenses"
    });
    
    const response3 = await fetch(`${baseUrl}&${params3.toString()}`);
    const data3 = await response3.json();
    
    console.log("Expenses only data:", data3);
    console.log("Revenue (should be 0):", data3.totalRevenue);
    console.log("Expenses (should have data):", data3.totalExpenses);
    
  } catch (error) {
    console.error("Test 3 failed:", error);
  }
}

// Run the test
testReportsAPI();
