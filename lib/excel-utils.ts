// lib/excel-utils.ts

import * as XLSX from 'xlsx';

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  status?: "present" | "absent" | "exempted" | "sick" | "assigned";
}

interface ExamData {
  id: string;
  name: string;
  subject: {
    name: string;
    code: string;
  };
  class: {
    name: string;
    level?: string;
  };
  examDate: string;
  totalMarks: number;
  examTypeName: string; // Use exam type instead of name
  students: Student[];
}

interface ParsedScore {
  examId: string;
  studentId: string;
  indexNumber: string;
  score: number;
  remarks?: string;
}

/**
 * Generate Excel workbook for multiple exams data
 * 
 * @param exams Array of exam data with student information
 * @param periodName The academic period name
 * @returns Excel workbook object
 */
/**
 * Generate Excel workbook for multiple exams data
 * 
 * @param exams Array of exam data with student information
 * @param periodName The academic period name
 * @returns Excel workbook object
 */
export function generateExcelWorkbook(
  exams: ExamData[],
  periodName: string
): XLSX.WorkBook {
  if (!exams || exams.length === 0) {
    throw new Error("No exam data provided");
  }

  // Extract common data from the first exam
  const { subject, class: className } = exams[0];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];
  
  // Add header information
  wsData.push(["Subject", subject.name]);
  wsData.push(["Class", className.name]);
  wsData.push(["Period", periodName]);
  wsData.push([]);
  
  // Create column headers with exam types
  const headerRow = ["Index Number", "Student Name"];
  
  // Add total marks row
  const marksRow = ["", "Total Marks"];
  
  // Create a hidden row for exam IDs
  const examIdsRow = ["", "EXAM_IDS"];
  
  exams.forEach((exam) => {
    // Use exam type for column header
    const columnHeader = `${exam.examTypeName}`;
    headerRow.push(columnHeader);
    marksRow.push(exam.totalMarks.toString());
    
    // Add exam ID to the hidden row
    examIdsRow.push(exam.id);
  });
  
  wsData.push(headerRow);
  wsData.push(examIdsRow); // Add hidden row with exam IDs
  wsData.push(marksRow);
  
  // Get unique students from all exams
  const uniqueStudents = getAllUniqueStudents(exams);
  
  // Add student rows
  uniqueStudents.forEach(student => {
    const row = [
      student.indexNumber,
      student.name
    ];
    
    // Add empty cells for scores
    exams.forEach(() => {
      row.push("0");
    });
    
    wsData.push(row);
  });
  
  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Index Number
    { wch: 30 }, // Student Name
    ...exams.map(() => ({ wch: 20 })) // Width for each exam column
  ];
  
  // Hide the exam IDs row (row index 5)
  // Note: This works in Excel but might not work in all spreadsheet software
  const hiddenRowIndex = 5;
  // Attempt to add row properties to hide the row
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][hiddenRowIndex] = { hidden: true };
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Exam Scores");
  
  return wb;
}

/**
 * Extract all unique students from multiple exams
 * 
 * @param exams Array of exam data with students
 * @returns Array of unique students
 */
function getAllUniqueStudents(exams: ExamData[]): Student[] {
  // Use a Map with student ID as key to ensure uniqueness
  const studentsMap = new Map<string, Student>();
  
  exams.forEach(exam => {
    exam.students.forEach(student => {
      if (!studentsMap.has(student.id)) {
        studentsMap.set(student.id, student);
      }
    });
  });
  
  // Convert Map to array and sort by name
  return Array.from(studentsMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Trigger download of Excel file
 * 
 * @param filename The name of the file (without extension)
 * @param workbook The Excel workbook to download
 */
export function downloadExcel(filename: string, workbook: XLSX.WorkBook): void {
  // Write workbook to binary string
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to array buffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create blob and URL
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Process uploaded Excel file to extract scores
 * 
 * @param file The uploaded Excel file
 * @param exams Array of exam data for matching scores to the right exams/students
 * @returns Promise resolving to parsed scores
 */
export function processExcelFile(
  file: File,
  exams: ExamData[]
): Promise<ParsedScore[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const wsname = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[wsname];
        
        // Convert worksheet to array of arrays
        const sheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        console.log({sheetData});
        
        // Look for the exam IDs row (should be after headers)
        let examIdsRowIndex = -1;
        for (let i = 0; i < sheetData.length; i++) {
          if (sheetData[i] && sheetData[i][1] === 'EXAM_IDS') {
            examIdsRowIndex = i;
            break;
          }
        }
        
        // If we can't find the exam IDs row, try to match by exam type
        let examMap: {[key: number]: string} = {};
        
        if (examIdsRowIndex >= 0) {
          // Extract exam IDs from the row
          const examIdsRow = sheetData[examIdsRowIndex];
          
          // Start from column 2 (skip Index Number and Student Name)
          for (let colIdx = 2; colIdx < examIdsRow.length; colIdx++) {
            if (examIdsRow[colIdx]) {
              examMap[colIdx] = examIdsRow[colIdx].toString();
            }
          }
        } else {
          // Fallback: Try to match by exam type in header row
          // Find the header row (usually row 4)
          const headerRow = sheetData[4];
          
          if (headerRow) {
            // Skip the first two columns (Index Number, Student Name)
            for (let colIdx = 2; colIdx < headerRow.length; colIdx++) {
              const examType = headerRow[colIdx]?.toString();
              if (!examType) continue;
              
              // Find the exam with this type name
              const matchingExam = exams.find(e => e.examTypeName === examType);
              if (matchingExam) {
                examMap[colIdx] = matchingExam.id;
              }
            }
          }
        }
        
        // If we couldn't find any exam IDs, fail
        if (Object.keys(examMap).length === 0) {
          throw new Error("Could not find exam IDs in the uploaded file");
        }
        
        // Find where student data starts
        // If we found the exam IDs row, student data starts after that and the marks row
        let dataStartRow = examIdsRowIndex >= 0 ? examIdsRowIndex + 2 : 6;
        
        const parsedScores: ParsedScore[] = [];
        
        // Process student rows
        for (let rowIdx = dataStartRow; rowIdx < sheetData.length; rowIdx++) {
          const row = sheetData[rowIdx];
          if (!row || row.length < 2) continue;
          
          const indexNumber = row[0]?.toString();
          if (!indexNumber) continue;
          
          // Process score columns (starting from column 2)
          for (let colIdx = 2; colIdx < row.length; colIdx++) {
            const examId = examMap[colIdx];
            if (!examId) continue;
            
            const scoreValue = row[colIdx];
            if (!scoreValue) continue;
            
            const score = parseFloat(scoreValue.toString());
            if (isNaN(score) || score <= 0) continue;
            
            // Find the exam and student
            const exam = exams.find(e => e.id === examId);
            if (!exam) continue;
            
            const student = exam.students.find(s => s.indexNumber === indexNumber);
            if (!student) continue;
            
            parsedScores.push({
              examId,
              studentId: student.id,
              indexNumber,
              score
            });
          }
        }
        
        resolve(parsedScores);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsArrayBuffer(file);
  });
}