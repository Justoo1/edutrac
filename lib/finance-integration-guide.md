# 🏦 Finance Module Database Integration Guide

## 📋 Summary of Changes Made

### ✅ What I've Created:

1. **Enhanced Database Schema** (`lib/finance-schema-additions.ts`)
   - `feeStructures` - Manage fee structures by class/level
   - `staffSalaries` - Staff salary management and payroll
   - `expenses` - Expense tracking and approval workflow
   - `financialTransactions` - Central financial transaction log
   - `budgets` - Budget planning and tracking
   - `paymentReminders` - Automated payment reminders

2. **Database Query Functions** (`lib/finance/queries.ts`)
   - Student fees management functions
   - Staff salary processing functions
   - Expense management functions
   - Financial analytics and reporting functions
   - Fee structure management functions

3. **API Routes** (`app/api/finance/`)
   - `/api/finance/student-fees` - Student fee operations
   - `/api/finance/staff-salaries` - Staff salary operations
   - `/api/finance/expenses` - Expense management
   - `/api/finance/overview` - Financial analytics

4. **React Hooks** (`hooks/finance/useFinanceData.ts`)
   - `useStudentFees` - Fetch student fee data
   - `useStaffSalaries` - Fetch staff salary data
   - `useExpenses` - Fetch expense data
   - `useFinancialOverview` - Fetch financial analytics
   - `useFinanceActions` - Actions for CRUD operations

5. **Updated Components**
   - Enhanced `StudentFeesManagement` to use real data
   - Ready for database integration

## 🚀 Next Steps to Complete Integration:

### 1. Add Finance Schema to Main Schema File
```typescript
// Add this to your lib/schema.ts file:

// Import the new tables from finance-schema-additions.ts
export * from './finance-schema-additions'

// Or copy the table definitions directly into schema.ts
```

### 2. Run Database Migration
```bash
# Generate migration for new tables
npx drizzle-kit generate:pg

# Push changes to database
npx drizzle-kit push:pg
```

### 3. Update Existing Tables (Optional Enhancements)
```sql
-- Add these columns to existing feePayments table for better tracking:
ALTER TABLE "feePayments" ADD COLUMN "feeStructureId" text REFERENCES "feeStructures"("id");
ALTER TABLE "feePayments" ADD COLUMN "parentGuardianId" text REFERENCES "guardians"("id");
ALTER TABLE "feePayments" ADD COLUMN "paymentStatus" text DEFAULT 'completed';
ALTER TABLE "feePayments" ADD COLUMN "balanceAmount" real DEFAULT 0;
ALTER TABLE "feePayments" ADD COLUMN "receiptNumber" text;
ALTER TABLE "feePayments" ADD COLUMN "receiptUrl" text;
```

### 4. Update Session/Context to Include School ID
```typescript
// In your session configuration or context provider
// Make sure schoolId is available in session.user

// Example in [...nextauth].ts:
export const authOptions: AuthOptions = {
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        // Get user's school ID from database
        const user = await db.select().from(users).where(eq(users.id, token.sub)).limit(1)
        if (user[0]) {
          session.user.id = user[0].id
          session.user.schoolId = user[0].schoolId // Add this
          session.user.role = user[0].role
        }
      }
      return session
    }
  }
}
```

### 5. Install Required Dependencies
```bash
npm install sonner  # For toast notifications (if not already installed)
```

### 6. Add Missing UI Components
Create a date range picker component if not already available:
```typescript
// components/ui/date-range-picker.tsx
// (This component is referenced but might not exist)
```

### 7. Update Other Finance Components
Update the remaining components to use real data:

#### a. Finance Overview Component:
```typescript
// Replace hardcoded data in finance-overview.tsx with:
import { useFinancialOverview } from "@/hooks/finance/useFinanceData"

const { data: monthlyData } = useFinancialOverview(schoolId, 'monthly', { year: 2024 })
const { data: overview } = useFinancialOverview(schoolId)
```

#### b. Staff Salary Management:
```typescript
// Replace hardcoded data in staff-salary-management.tsx with:
import { useStaffSalaries, useFinanceActions } from "@/hooks/finance/useFinanceData"

const { salaries, isLoading } = useStaffSalaries(schoolId)
const { processSalary } = useFinanceActions()
```

#### c. Expense Management:
```typescript
// Replace hardcoded data in expense-management.tsx with:
import { useExpenses, useFinanceActions } from "@/hooks/finance/useFinanceData"

const { expenses, isLoading } = useExpenses(schoolId, filters)
const { createExpense, approveExpense } = useFinanceActions()
```

## 📊 Database Schema Additions Required:

### Core Tables to Add:
```sql
CREATE TABLE "feeStructures" (
  "id" text PRIMARY KEY,
  "schoolId" text NOT NULL REFERENCES "schools"("id"),
  "className" text NOT NULL,
  "level" text NOT NULL,
  "academicYear" text NOT NULL,
  "tuitionFee" real DEFAULT 0,
  "activitiesFee" real DEFAULT 0,
  "examinationFee" real DEFAULT 0,
  "libraryFee" real DEFAULT 0,
  "laboratoryFee" real DEFAULT 0,
  "transportFee" real DEFAULT 0,
  "totalFee" real NOT NULL,
  "status" text DEFAULT 'active',
  "studentsEnrolled" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "staffSalaries" (
  "id" text PRIMARY KEY,
  "staffId" text NOT NULL REFERENCES "staff"("id"),
  "schoolId" text NOT NULL REFERENCES "schools"("id"),
  "baseSalary" real NOT NULL,
  "allowances" real DEFAULT 0,
  "deductions" real DEFAULT 0,
  "netSalary" real NOT NULL,
  "paymentDate" timestamp,
  "paymentMethod" text,
  "paymentReference" text,
  "accountNumber" text,
  "payPeriod" text NOT NULL,
  "academicYear" text NOT NULL,
  "status" text DEFAULT 'pending',
  "processedBy" text REFERENCES "staff"("id"),
  "notes" text,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "expenses" (
  "id" text PRIMARY KEY,
  "schoolId" text NOT NULL REFERENCES "schools"("id"),
  "description" text NOT NULL,
  "category" text NOT NULL,
  "vendor" text NOT NULL,
  "department" text NOT NULL,
  "amount" real NOT NULL,
  "expenseDate" timestamp NOT NULL,
  "paymentMethod" text,
  "paymentReference" text,
  "receiptUrl" text,
  "status" text DEFAULT 'pending',
  "approvedBy" text REFERENCES "staff"("id"),
  "approvedAt" timestamp,
  "recordedBy" text NOT NULL REFERENCES "staff"("id"),
  "notes" text,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "financialTransactions" (
  "id" text PRIMARY KEY,
  "schoolId" text NOT NULL REFERENCES "schools"("id"),
  "type" text NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" real NOT NULL,
  "transactionDate" timestamp NOT NULL,
  "referenceType" text,
  "referenceId" text,
  "paymentMethod" text,
  "transactionReference" text,
  "recordedBy" text NOT NULL REFERENCES "staff"("id"),
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
```

## 🔧 Configuration Updates:

### 1. Environment Variables
Ensure your `.env` file has:
```env
DATABASE_URL="your_postgres_connection_string"
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Connection
Ensure `lib/db.ts` is properly configured:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

## 🎯 Testing the Integration:

### 1. Test API Endpoints:
```bash
# Test student fees API
curl "http://localhost:3000/api/finance/student-fees?schoolId=your_school_id"

# Test staff salaries API
curl "http://localhost:3000/api/finance/staff-salaries?schoolId=your_school_id"

# Test expenses API
curl "http://localhost:3000/api/finance/expenses?schoolId=your_school_id"
```

### 2. Test Database Queries:
```typescript
// Test in your development environment
import { getStudentsWithFees } from '@/lib/finance/queries'

const students = await getStudentsWithFees('your_school_id')
console.log(students)
```

## 🚨 Important Notes:

1. **Authentication**: Make sure your NextAuth setup includes schoolId in the session
2. **Authorization**: Add proper role-based access control for finance operations
3. **Validation**: Add proper input validation for all API endpoints
4. **Error Handling**: Implement comprehensive error handling and logging
5. **Backup**: Always backup your database before running migrations

## 📈 Features Now Available:

✅ **Student Fee Management**
- Track individual student fee payments
- Multiple fee types and structures
- Payment history and status tracking
- Outstanding balance calculations

✅ **Staff Salary Management**
- Monthly salary processing
- Allowances and deductions tracking
- Payment method management
- Payroll history

✅ **Expense Management**
- Expense categorization and tracking
- Approval workflow
- Vendor management
- Receipt storage

✅ **Financial Analytics**
- Revenue vs expense tracking
- Monthly financial trends
- Category-wise breakdowns
- Profit/loss calculations

✅ **Reporting**
- Comprehensive financial reports
- Export functionality
- Custom date ranges
- Multiple formats (PDF, Excel, CSV)

## 🔄 Next Development Phase:

Once the database integration is complete, you can:

1. Add automated fee calculation based on class enrollment
2. Implement payment reminder system (SMS/Email)
3. Add budget planning and variance tracking
4. Create detailed financial forecasting
5. Add integration with mobile money APIs (MTN, Vodafone)
6. Implement receipt generation and printing
7. Add audit trails for all financial transactions

---

**Ready to integrate!** Follow the steps above to connect your finance module to the database and enjoy a fully functional school finance management system! 🎉
