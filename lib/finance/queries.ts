import db from "@/lib/db";
import { 
  students, 
  staff, 
  feePayments, 
  feeTypes,
  schools,
  classes,
  classEnrollments,
  feeStructures,
  staffSalaries,
  expenses,
  financialTransactions as financialTransactionsTable
} from "@/lib/schema";
import { eq, and, desc, asc, sql, between, sum, count } from "drizzle-orm";

// Student Fees Functions
export async function getStudentsWithFees(schoolId: string) {
  try {
    // First, get students with their current class information
    const studentsWithClasses = await db
      .select({
        student: students,
        className: classes.name,
        gradeLevel: classes.gradeLevel,
      })
      .from(students)
      .leftJoin(classEnrollments, and(
        eq(classEnrollments.studentId, students.id),
        eq(classEnrollments.status, 'active')
      ))
      .leftJoin(classes, eq(classes.id, classEnrollments.classId))
      .where(eq(students.schoolId, schoolId));

    // Then, calculate fees for each student
    const studentsWithFees = await Promise.all(
      studentsWithClasses.map(async (studentData) => {
        const student = studentData.student;
        
        // Get applicable fee types for this student
        const applicableFees = await db
          .select({
            id: feeTypes.id,
            amount: feeTypes.amount,
            dueDate: feeTypes.dueDate,
            name: feeTypes.name
          })
          .from(feeTypes)
          .where(
            and(
              eq(feeTypes.schoolId, schoolId),
              // Match fee types that apply to this student's grade level or are for all levels
              sql`(${feeTypes.gradeLevel} IS NULL OR ${feeTypes.gradeLevel} = '' OR ${feeTypes.gradeLevel} = 'all' OR ${feeTypes.gradeLevel} = ${studentData.gradeLevel})`
            )
          );

        // Calculate total fees for this student
        const totalFees = applicableFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);

        // Get payments made by this student
        const payments = await db
          .select({
            amount: feePayments.amount,
            paymentDate: feePayments.paymentDate,
          })
          .from(feePayments)
          .innerJoin(feeTypes, eq(feeTypes.id, feePayments.feeTypeId))
          .where(
            and(
              eq(feePayments.studentId, student.id),
              eq(feeTypes.schoolId, schoolId)
            )
          );

        // Calculate payment totals
        const paidAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const pendingAmount = Math.max(0, totalFees - paidAmount);
        
        // Get last payment date
        const lastPayment = payments.length > 0 
          ? new Date(Math.max(...payments.map(p => new Date(p.paymentDate).getTime())))
          : null;

        // Determine payment status
        let paymentStatus = 'unpaid';
        if (paidAmount >= totalFees && totalFees > 0) {
          paymentStatus = 'paid';
        } else if (paidAmount > 0) {
          paymentStatus = 'partial';
        } else {
          // Check if any fees are overdue
          const today = new Date();
          const hasOverdueFees = applicableFees.some(fee => 
            fee.dueDate && new Date(fee.dueDate) < today
          );
          paymentStatus = hasOverdueFees ? 'overdue' : 'unpaid';
        }

        return {
          student: {
            ...student,
            currentClass: studentData.className,
            currentGradeLevel: studentData.gradeLevel
          },
          totalFees,
          paidAmount,
          pendingAmount,
          lastPayment: lastPayment ? lastPayment.toISOString() : null,
          paymentStatus
        };
      })
    );

    return studentsWithFees;
  } catch (error) {
    console.error("Error fetching students with fees:", error);
    throw error;
  }
}

export async function getStudentFeeDetails(studentId: string) {
  try {
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student.length) {
      throw new Error("Student not found");
    }

    const studentData = student[0];
    if (!studentData.schoolId) {
      throw new Error("Student has no school association");
    }

    const feeDetails = await db
      .select({
        feeType: feeTypes,
        payments: feePayments,
      })
      .from(feeTypes)
      .leftJoin(feePayments, 
        and(
          eq(feePayments.feeTypeId, feeTypes.id),
          eq(feePayments.studentId, studentId)
        )
      )
      .where(eq(feeTypes.schoolId, studentData.schoolId));

    return {
      student: studentData,
      feeDetails
    };
  } catch (error) {
    console.error("Error fetching student fee details:", error);
    throw error;
  }
}

export async function recordFeePayment(paymentData: {
  studentId: string;
  feeTypeId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  academicYear: string;
  term: string;
  recordedBy: string;
  notes?: string;
}) {
  try {
    // Validate required fields
    if (!paymentData.recordedBy) {
      throw new Error("recordedBy is required but was not provided");
    }
    
    if (!paymentData.studentId || !paymentData.feeTypeId) {
      throw new Error("studentId and feeTypeId are required");
    }

    console.log("Recording payment with data:", {
      ...paymentData,
      recordedBy: paymentData.recordedBy
    });

    const result = await db.transaction(async (tx) => {
      // Insert fee payment
      const payment = await tx
        .insert(feePayments)
        .values({
          studentId: paymentData.studentId,
          feeTypeId: paymentData.feeTypeId,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          academicYear: paymentData.academicYear,
          term: paymentData.term,
          recordedBy: paymentData.recordedBy,
          notes: paymentData.notes,
          paymentDate: new Date(),
          status: 'paid'
        })
        .returning();

      // Get student's school ID
      const studentRecord = await tx
        .select({ schoolId: students.schoolId })
        .from(students)
        .where(eq(students.id, paymentData.studentId))
        .limit(1);

      if (!studentRecord.length || !studentRecord[0].schoolId) {
        throw new Error("Student school information not found");
      }

      // Create financial transaction record with explicit validation
      const transactionData = {
        schoolId: studentRecord[0].schoolId,
        type: 'income' as const,
        category: 'fees',
        description: `Fee payment from student`,
        amount: paymentData.amount,
        transactionDate: new Date(),
        referenceType: 'feePayment',
        referenceId: payment[0].id,
        paymentMethod: paymentData.paymentMethod,
        transactionReference: paymentData.transactionId,
        recordedBy: paymentData.recordedBy
      };

      console.log("Creating financial transaction with:", transactionData);

      await tx
        .insert(financialTransactionsTable)
        .values(transactionData);

      return payment[0];
    });

    return result;
  } catch (error) {
    console.error("Error recording fee payment:", error);
    throw error;
  }
}

// Staff Salary Functions
export async function getStaffSalaries(schoolId: string, payPeriod?: string) {
  try {
    const baseCondition = eq(staffSalaries.schoolId, schoolId);
    const whereCondition = payPeriod 
      ? and(baseCondition, eq(staffSalaries.payPeriod, payPeriod))
      : baseCondition;

    const query = db
      .select({
        salary: staffSalaries,
        staff: staff,
      })
      .from(staffSalaries)
      .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
      .where(whereCondition)
      .orderBy(desc(staffSalaries.paymentDate));

    return await query;
  } catch (error) {
    console.error("Error fetching staff salaries:", error);
    throw error;
  }
}

// Process multiple salary payments (for payroll processing)
export async function processPayrollPayments(payrollData: {
  schoolId: string;
  payPeriod: string;
  paymentMethod: string;
  processedBy: string;
  notes?: string;
}) {
  try {
    console.log('Starting payroll processing with data:', payrollData);
    
    const result = await db.transaction(async (tx) => {
      // Get all pending salaries for the specified period
      const pendingSalaries = await tx
        .select()
        .from(staffSalaries)
        .where(
          and(
            eq(staffSalaries.schoolId, payrollData.schoolId),
            eq(staffSalaries.payPeriod, payrollData.payPeriod),
            eq(staffSalaries.status, 'pending')
          )
        );

      console.log(`Found ${pendingSalaries.length} pending salaries:`, pendingSalaries);

      if (pendingSalaries.length === 0) {
        throw new Error('No pending salaries found for the specified period');
      }

      // Process each salary individually to ensure all get updated
      const updatedSalaries = [];
      const transactionRecords = [];

      for (const salary of pendingSalaries) {
        console.log(`Processing salary for staff ID: ${salary.staffId}`);
        
        // Update individual salary record
        const updatedSalary = await tx
          .update(staffSalaries)
          .set({
            status: 'paid',
            paymentDate: new Date(),
            paymentMethod: payrollData.paymentMethod,
            processedBy: payrollData.processedBy,
            notes: payrollData.notes
          })
          .where(eq(staffSalaries.id, salary.id))
          .returning();

        if (updatedSalary.length > 0) {
          updatedSalaries.push(updatedSalary[0]);
          console.log(`Updated salary record:`, updatedSalary[0]);

          // Create financial transaction for this salary
          const transaction = await tx
            .insert(financialTransactionsTable)
            .values({
              schoolId: payrollData.schoolId,
              type: 'expense',
              category: 'salary',
              description: `Salary payment - ${payrollData.payPeriod}`,
              amount: updatedSalary[0].netSalary,
              transactionDate: new Date(),
              referenceType: 'staffSalary',
              referenceId: updatedSalary[0].id,
              paymentMethod: payrollData.paymentMethod,
              recordedBy: payrollData.processedBy
            })
            .returning();
          
          transactionRecords.push(transaction[0]);
          console.log(`Created financial transaction:`, transaction[0]);
        }
      }

      console.log(`Successfully processed ${updatedSalaries.length} salaries`);

      return {
        processedCount: updatedSalaries.length,
        totalAmount: updatedSalaries.reduce((sum, salary) => sum + salary.netSalary, 0),
        salaries: updatedSalaries,
        transactions: transactionRecords
      };
    });

    console.log('Payroll processing completed successfully:', result);
    return result;
  } catch (error) {
    console.error("Error processing payroll payments:", error);
    throw error;
  }
}

// Get pending salaries for a specific pay period
export async function getPendingSalariesForPeriod(schoolId: string, payPeriod: string) {
  try {
    const pendingSalaries = await db
      .select({
        salary: staffSalaries,
        staff: staff,
      })
      .from(staffSalaries)
      .innerJoin(staff, eq(staff.id, staffSalaries.staffId))
      .where(
        and(
          eq(staffSalaries.schoolId, schoolId),
          eq(staffSalaries.payPeriod, payPeriod),
          eq(staffSalaries.status, 'pending')
        )
      )
      .orderBy(staff.name);

    const summary = {
      totalStaff: pendingSalaries.length,
      totalAmount: pendingSalaries.reduce((sum, item) => sum + item.salary.netSalary, 0)
    };

    return {
      salaries: pendingSalaries,
      summary
    };
  } catch (error) {
    console.error("Error fetching pending salaries:", error);
    throw error;
  }
}
export async function createSalaryRecord(salaryData: {
  staffId: string;
  schoolId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  payPeriod: string;
  academicYear: string;
  paymentMethod: string;
  accountNumber?: string;
  recordedBy: string;
  notes?: string;
}) {
  try {
    const netSalary = salaryData.baseSalary + salaryData.allowances - salaryData.deductions;

    const result = await db
      .insert(staffSalaries)
      .values({
        ...salaryData,
        netSalary,
        status: 'pending', // Create as pending, not paid
        processedBy: salaryData.recordedBy, // Map recordedBy to processedBy
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating salary record:", error);
    throw error;
  }
}

export async function processSalaryPayment(salaryData: {
  staffId: string;
  schoolId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  payPeriod: string;
  academicYear: string;
  paymentMethod: string;
  accountNumber?: string;
  processedBy: string;
  notes?: string;
}) {
  try {
    const netSalary = salaryData.baseSalary + salaryData.allowances - salaryData.deductions;

    const result = await db.transaction(async (tx) => {
      // Insert salary record
      const salary = await tx
        .insert(staffSalaries)
        .values({
          ...salaryData,
          netSalary,
          paymentDate: new Date(),
          status: 'paid'
        })
        .returning();

      // Create financial transaction record
      await tx
        .insert(financialTransactionsTable)
        .values({
          schoolId: salaryData.schoolId,
          type: 'expense',
          category: 'salary',
          description: `Salary payment to staff member`,
          amount: netSalary,
          transactionDate: new Date(),
          referenceType: 'staffSalary',
          referenceId: salary[0].id,
          paymentMethod: salaryData.paymentMethod,
          recordedBy: salaryData.processedBy
        });

      return salary[0];
    });

    return result;
  } catch (error) {
    console.error("Error processing salary payment:", error);
    throw error;
  }
}

// Expense Management Functions
export async function getExpenses(schoolId: string, filters?: {
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // Build conditions array
    const conditions = [eq(expenses.schoolId, schoolId)];

    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category));
    }

    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status));
    }

    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(expenses.expenseDate, filters.startDate, filters.endDate));
    }

    const query = db
      .select({
        expense: expenses,
        approver: staff,
      })
      .from(expenses)
      .leftJoin(staff, eq(staff.id, expenses.approvedBy))
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate));

    return await query;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

export async function createExpense(expenseData: {
  schoolId: string;
  description: string;
  category: string;
  vendor: string;
  department: string;
  amount: number;
  expenseDate: Date;
  paymentMethod?: string;
  paymentReference?: string;
  receiptUrl?: string;
  recordedBy: string;
  notes?: string;
}) {
  try {
    const result = await db
      .insert(expenses)
      .values({
        ...expenseData,
        status: 'pending'
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function approveExpense(expenseId: string, approvedBy: string) {
  try {
    const result = await db.transaction(async (tx) => {
      // Update expense status
      const expense = await tx
        .update(expenses)
        .set({
          status: 'approved',
          approvedBy,
          approvedAt: new Date()
        })
        .where(eq(expenses.id, expenseId))
        .returning();

      // Create financial transaction record
      await tx
        .insert(financialTransactions)
        .values({
          schoolId: expense[0].schoolId,
          type: 'expense',
          category: expense[0].category,
          description: expense[0].description,
          amount: expense[0].amount,
          transactionDate: expense[0].expenseDate,
          referenceType: 'expense',
          referenceId: expense[0].id,
          paymentMethod: expense[0].paymentMethod,
          transactionReference: expense[0].paymentReference,
          recordedBy: approvedBy
        });

      return expense[0];
    });

    return result;
  } catch (error) {
    console.error("Error approving expense:", error);
    throw error;
  }
}

// Financial Analytics Functions
export async function getFinancialOverview(schoolId: string, period?: {
  startDate: Date;
  endDate: Date;
}) {
  try {
    const whereCondition = period
      ? and(
          eq(financialTransactionsTable.schoolId, schoolId),
          between(financialTransactionsTable.transactionDate, period.startDate, period.endDate)
        )
      : eq(financialTransactionsTable.schoolId, schoolId);

    const overview = await db
      .select({
        type: financialTransactionsTable.type,
        category: financialTransactionsTable.category,
        totalAmount: sum(financialTransactionsTable.amount),
        transactionCount: count(financialTransactionsTable.id)
      })
      .from(financialTransactionsTable)
      .where(whereCondition)
      .groupBy(financialTransactionsTable.type, financialTransactionsTable.category);

    return overview;
  } catch (error) {
    console.error("Error fetching financial overview:", error);
    throw error;
  }
}

export async function getMonthlyFinancialData(schoolId: string, year: number) {
  try {
    const data = await db
      .select({
        month: sql<string>`TO_CHAR(${financialTransactionsTable.transactionDate}, 'YYYY-MM')`,
        type: financialTransactionsTable.type,
        totalAmount: sum(financialTransactionsTable.amount),
      })
      .from(financialTransactionsTable)
      .where(
        and(
          eq(financialTransactionsTable.schoolId, schoolId),
          sql`EXTRACT(YEAR FROM ${financialTransactionsTable.transactionDate}) = ${year}`
        )
      )
      .groupBy(
        sql`TO_CHAR(${financialTransactionsTable.transactionDate}, 'YYYY-MM')`,
        financialTransactionsTable.type
      )
      .orderBy(sql`TO_CHAR(${financialTransactionsTable.transactionDate}, 'YYYY-MM')`);

    return data;
  } catch (error) {
    console.error("Error fetching monthly financial data:", error);
    throw error;
  }
}

// Fee Structure Functions
export async function getFeeStructures(schoolId: string, academicYear?: string) {
  try {
    const baseCondition = eq(feeStructures.schoolId, schoolId);
    const whereCondition = academicYear 
      ? and(baseCondition, eq(feeStructures.academicYear, academicYear))
      : baseCondition;

    const query = db
      .select()
      .from(feeStructures)
      .where(whereCondition)
      .orderBy(asc(feeStructures.className));

    return await query;
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    throw error;
  }
}

export async function createFeeStructure(structureData: {
  schoolId: string;
  className: string;
  level: string;
  academicYear: string;
  tuitionFee: number;
  activitiesFee: number;
  examinationFee: number;
  libraryFee: number;
  laboratoryFee: number;
  transportFee: number;
}) {
  try {
    const totalFee = 
      structureData.tuitionFee +
      structureData.activitiesFee +
      structureData.examinationFee +
      structureData.libraryFee +
      structureData.laboratoryFee +
      structureData.transportFee;

    const result = await db
      .insert(feeStructures)
      .values({
        ...structureData,
        totalFee,
        status: 'active'
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating fee structure:", error);
    throw error;
  }
}

// Additional helper functions for better fee management
export async function getStudentOutstandingFees(studentId: string) {
  try {
    const student = await db
      .select({ schoolId: students.schoolId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student.length || !student[0].schoolId) {
      throw new Error("Student not found or has no school association");
    }

    const outstandingFees = await db
      .select({
        feeType: feeTypes,
        totalPaid: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)`,
        outstandingAmount: sql<number>`${feeTypes.amount} - COALESCE(SUM(${feePayments.amount}), 0)`,
      })
      .from(feeTypes)
      .leftJoin(feePayments, and(
        eq(feePayments.feeTypeId, feeTypes.id),
        eq(feePayments.studentId, studentId)
      ))
      .where(eq(feeTypes.schoolId, student[0].schoolId))
      .groupBy(feeTypes.id)
      .having(sql`${feeTypes.amount} - COALESCE(SUM(${feePayments.amount}), 0) > 0`);

    return outstandingFees;
  } catch (error) {
    console.error("Error fetching student outstanding fees:", error);
    throw error;
  }
}

export async function getPaymentHistory(studentId: string, limit: number = 20) {
  try {
    const payments = await db
      .select({
        payment: feePayments,
        feeType: feeTypes,
      })
      .from(feePayments)
      .innerJoin(feeTypes, eq(feeTypes.id, feePayments.feeTypeId))
      .where(eq(feePayments.studentId, studentId))
      .orderBy(desc(feePayments.paymentDate))
      .limit(limit);

    return payments;
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
}

export async function getSchoolFinancialSummary(schoolId: string, academicYear?: string) {
  try {
    const whereConditions = [eq(financialTransactionsTable.schoolId, schoolId)];
    
    if (academicYear) {
      whereConditions.push(
        sql`EXTRACT(YEAR FROM ${financialTransactionsTable.transactionDate}) = ${academicYear.split('-')[0]}`
      );
    }

    const summary = await db
      .select({
        type: financialTransactionsTable.type,
        totalAmount: sum(financialTransactionsTable.amount),
        transactionCount: count(financialTransactionsTable.id),
      })
      .from(financialTransactionsTable)
      .where(and(...whereConditions))
      .groupBy(financialTransactionsTable.type);

    const totalIncome = summary.find(s => s.type === 'income')?.totalAmount || 0;
    const totalExpenses = summary.find(s => s.type === 'expense')?.totalAmount || 0;
    const netIncome = Number(totalIncome) - Number(totalExpenses);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      summary
    };
  } catch (error) {
    console.error("Error fetching school financial summary:", error);
    throw error;
  }
}

// Fee Type Management Functions
export async function getFeeTypes(schoolId: string, filters?: {
  academicYear?: string;
  term?: string;
  gradeLevel?: string;
}) {
  try {
    const conditions = [eq(feeTypes.schoolId, schoolId)];

    if (filters?.academicYear) {
      conditions.push(eq(feeTypes.academicYear, filters.academicYear));
    }

    if (filters?.term) {
      conditions.push(eq(feeTypes.term, filters.term));
    }

    if (filters?.gradeLevel) {
      conditions.push(eq(feeTypes.gradeLevel, filters.gradeLevel));
    }

    const fees = await db
      .select()
      .from(feeTypes)
      .where(and(...conditions))
      .orderBy(asc(feeTypes.name));

    return fees;
  } catch (error) {
    console.error("Error fetching fee types:", error);
    throw error;
  }
}

export async function createFeeType(feeData: {
  schoolId: string;
  name: string;
  description?: string;
  amount: number;
  frequency: string;
  gradeLevel?: string;
  academicYear: string;
  term: string;
  optional?: boolean;
  dueDate?: Date;
}) {
  try {
    const result = await db
      .insert(feeTypes)
      .values(feeData)
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating fee type:", error);
    throw error;
  }
}

export async function updateFeeType(feeId: string, updateData: Partial<{
  name: string;
  description: string;
  amount: number;
  frequency: string;
  gradeLevel: string;
  academicYear: string;
  term: string;
  optional: boolean;
  dueDate: Date;
}>) {
  try {
    const result = await db
      .update(feeTypes)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(feeTypes.id, feeId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating fee type:", error);
    throw error;
  }
}

export async function deleteFeeType(feeId: string) {
  try {
    const result = await db
      .delete(feeTypes)
      .where(eq(feeTypes.id, feeId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error deleting fee type:", error);
    throw error;
  }
}

// Get fees with payment status for a specific student
export async function getStudentFeesWithStatus(studentId: string, academicYear?: string, term?: string) {
  try {
    const student = await db
      .select({ schoolId: students.schoolId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student.length || !student[0].schoolId) {
      throw new Error("Student not found or has no school association");
    }

    const conditions = [eq(feeTypes.schoolId, student[0].schoolId)];
    
    if (academicYear) {
      conditions.push(eq(feeTypes.academicYear, academicYear));
    }
    
    if (term) {
      conditions.push(eq(feeTypes.term, term));
    }

    const feesWithStatus = await db
      .select({
        feeType: feeTypes,
        totalPaid: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)`,
        remainingAmount: sql<number>`${feeTypes.amount} - COALESCE(SUM(${feePayments.amount}), 0)`,
        paymentStatus: sql<string>`
          CASE 
            WHEN COALESCE(SUM(${feePayments.amount}), 0) >= ${feeTypes.amount} THEN 'paid'
            WHEN COALESCE(SUM(${feePayments.amount}), 0) > 0 THEN 'partial'
            ELSE 'unpaid'
          END
        `,
        lastPaymentDate: sql<string>`MAX(${feePayments.paymentDate})`
      })
      .from(feeTypes)
      .leftJoin(feePayments, and(
        eq(feePayments.feeTypeId, feeTypes.id),
        eq(feePayments.studentId, studentId)
      ))
      .where(and(...conditions))
      .groupBy(feeTypes.id)
      .orderBy(asc(feeTypes.name));

    return feesWithStatus;
  } catch (error) {
    console.error("Error fetching student fees with status:", error);
    throw error;
  }
}
