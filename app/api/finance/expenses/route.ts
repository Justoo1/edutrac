import { NextRequest, NextResponse } from "next/server";
import { getExpenses, createExpense, approveExpense, deleteExpense, updateExpense } from "@/lib/finance/queries";
import { getSession } from "@/lib/auth";
import db  from '@/lib/db';
import { eq } from "drizzle-orm";
import { staff, expenses } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const expenses = await getExpenses(schoolId, filters);
    return NextResponse.json(expenses);

  } catch (error) {
    console.error("Error in expenses API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const staff_ = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    })
    if(!staff_){
      console.log('Staff member not found');
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }
    
    const expense = await createExpense({
      ...body,
      recordedBy: staff_.id,
      expenseDate: new Date(body.expenseDate)
    });

    return NextResponse.json(expense, { status: 201 });

  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expenseId, action, ...updateData } = body;
    const staff_ = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    })
    if(!staff_){
      console.log('Staff member not found');
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (action === "approve") {
      const expense = await approveExpense(expenseId, staff_.id);
      return NextResponse.json(expense);
    }

    if (action === "update") {
      // Get the expense first to check if it can be updated
      const existingExpense = await db.query.expenses.findFirst({
        where: eq(expenses.id, expenseId)
      })
      
      if (!existingExpense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      
      // Only allow updating pending expenses
      if (existingExpense.status !== 'pending') {
        return NextResponse.json({ 
          error: "Only pending expenses can be updated" 
        }, { status: 400 });
      }
      
      // Handle date conversion if expenseDate is provided
      const processedUpdateData = { ...updateData };
      if (processedUpdateData.expenseDate) {
        processedUpdateData.expenseDate = new Date(processedUpdateData.expenseDate);
      }
      
      const expense = await updateExpense(expenseId, {
        ...processedUpdateData,
        updatedBy: staff_.id
      });
      return NextResponse.json(expense);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expenseId } = body;

    const staff_ = await db.query.staff.findFirst({
      where: eq(staff.userId, session.user.id)
    })
    if(!staff_){
      console.log('Staff member not found');
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Get the expense first to check if it can be deleted
    const existingExpense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId)
    })
    
    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    
    // Only allow deleting pending expenses
    if (existingExpense.status !== 'pending') {
      return NextResponse.json({ 
        error: "Only pending expenses can be deleted" 
      }, { status: 400 });
    }

    const deletedExpense = await deleteExpense(expenseId, staff_.id);
    return NextResponse.json(deletedExpense);

  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
