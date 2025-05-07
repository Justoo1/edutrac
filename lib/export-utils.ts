/**
 * Export Utilities for Exam Scores in EduTrac
 */

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  status?: "present" | "absent" | "exempted" | "sick" | "assigned";
}

interface ExamData {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  className: string;
  examDate: string;
  totalMarks: number;
  students: Student[];
}

/**
 * Generate Excel/CSV content for multiple exams in a class
 * 
 * @param exams Array of exam data with student information
 * @param periodName The academic period name
 * @returns CSV string content
 */
// Modified version of generateMultiExamTemplate function in lib/export-utils.ts

export function generateMultiExamTemplate(
  exams: ExamData[],
  periodName: string
): string {
  if (!exams || exams.length === 0) {
    throw new Error("No exam data provided");
  }

  // Extract common data from the first exam
  const { subject, subjectCode, className } = exams[0];

  // Create header rows with metadata
  const headerRows = [
    `Subject,${subject}`,
    `Class,${className}`,
    `Period,${periodName}`,
    ''
  ];

  // Extract all unique students from exams
  const allStudents = getAllUniqueStudents(exams);
  
  // Create column headers with exam names and total marks
  // Removed "Number" column
  const examHeaders = ['Index Number', 'Student Name'];
  const marksRow = ['', ''];
  
  // Add each exam as a column - now including exam IDs in a separate hidden row
  const examIdRow = ['Exam ID', ''];
  
  exams.forEach(exam => {
    examHeaders.push(exam.name);
    marksRow.push(exam.totalMarks.toString());
    examIdRow.push(exam.id); // Add exam ID to a separate row
  });
  
  // Remove the total column
  // (We simply don't add the Total column anymore)
  
  headerRows.push(examHeaders.join(','));
  headerRows.push(marksRow.join(','));
  headerRows.push(examIdRow.join(',')); // Add the exam IDs row
  
  // Create data rows for each student
  const studentRows = allStudents.map(student => {
    const row = [
      student.indexNumber,
      `"${student.name}"` // Quote the name to handle commas
    ];
    
    // Add an empty cell (default to 0) for each exam
    exams.forEach(() => row.push('0'));
    
    // We don't add empty cell for total anymore
    
    return row.join(',');
  });
  
  // Combine all rows into a CSV string
  return [...headerRows, ...studentRows].join('\n');
}

/**
 * Extract all unique students from multiple exams
 * 
 * @param exams Array of exam data with students
 * @returns Array of unique students 
 */
function getAllUniqueStudents(exams: ExamData[]): Student[] {
  // Create a map to deduplicate students by ID
  const studentsMap = new Map<string, Student>();
  
  exams.forEach(exam => {
    exam.students.forEach(student => {
      if (!studentsMap.has(student.id)) {
        studentsMap.set(student.id, student);
      }
    });
  });
  
  // Convert the map back to an array and sort by name
  return Array.from(studentsMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Trigger download of a CSV file in the browser
 * 
 * @param filename The name of the file to be downloaded
 * @param content The content of the CSV file
 */
export function downloadCSV(filename: string, content: string): void {
  // Create a Blob with the CSV content
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Append the link to the body (required for Firefox)
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date string for file naming
 * 
 * @param date Date string
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForFilename(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  } catch (error) {
    return 'unknown-date';
  }
}

interface ParsedScore {
  examId: string;
  studentId: string;
  indexNumber: string;
  score: number;
  remarks?: string;
}

/**
 * Parse CSV content from uploaded multi-exam scores file
 * 
 * @param file Uploaded CSV file
 * @param exams Array of exam data for matching columns to exam IDs
 * @returns Promise resolving to parsed scores array
 */
// Modified version of parseMultiExamScores in lib/export-utils.ts

export function parseMultiExamScores(
  file: File, 
  exams: ExamData[]
): Promise<ParsedScore[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        if (!csvContent) {
          throw new Error("Failed to read file content");
        }
        
        const lines = csvContent.split('\n');
        
        // Find the header rows (contains exam names and IDs)
        const headerRowIndex = lines.findIndex(line => 
          line.includes('Index Number') && 
          line.includes('Student Name')
        );
        
        if (headerRowIndex === -1) {
          throw new Error("Invalid file format: Header row not found");
        }
        
        // Parse header row to identify columns
        const headers = parseCSVRow(lines[headerRowIndex]);
        
        // The exam IDs should be in the row immediately after the marks row
        // So headerRowIndex + 2
        const examIdRow = parseCSVRow(lines[headerRowIndex + 2]);
        
        // Find positions of key columns
        const indexNumPos = headers.findIndex(h => 
          h.toLowerCase().includes('index number'));
        
        if (indexNumPos === -1) {
          throw new Error("Invalid file format: Index Number column not found");
        }
        
        // Create a map of column indices to exam IDs
        const examColumns: { index: number; examId: string }[] = [];
        
        headers.forEach((header, index) => {
          // Skip the first two columns (Index Number and Student Name)
          if (index > 1 && examIdRow[index]) {
            examColumns.push({
              index,
              examId: examIdRow[index]
            });
          }
        });
        
        if (examColumns.length === 0) {
          throw new Error("No exam columns found in file");
        }
        
        // Parse data rows
        const dataRows = lines.slice(headerRowIndex + 3); // Skip headers and exam ID row
        const parsedScores: ParsedScore[] = [];
        
        for (const row of dataRows) {
          if (!row.trim()) continue; // Skip empty rows
          
          const columns = parseCSVRow(row);
          if (columns.length <= indexNumPos) continue;
          
          const indexNumber = columns[indexNumPos].trim();
          if (!indexNumber) continue;
          
          // Process each exam column
          for (const examCol of examColumns) {
            if (columns.length <= examCol.index) continue;
            
            const scoreText = columns[examCol.index].trim();
            if (!scoreText || scoreText === '0') continue;
            
            const score = parseFloat(scoreText);
            if (isNaN(score)) continue;
            
            // Find the student ID from index number
            const exam = exams.find(e => e.id === examCol.examId);
            const student = exam?.students.find(s => 
              s.indexNumber === indexNumber
            );
            
            if (student) {
              parsedScores.push({
                examId: examCol.examId,
                studentId: student.id,
                indexNumber,
                score,
                remarks: ''
              });
            }
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
    
    reader.readAsText(file);
  });
}
/**
 * Parse a CSV row handling quoted values properly
 * 
 * @param row CSV row string
 * @returns Array of column values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last column
  result.push(current);
  
  return result;
} 

// In lib/export-utils.ts

import * as XLSX from 'xlsx/xlsx.mjs';

// New function for Excel export
export function generateMultiExamExcel(
  exams: ExamData[],
  periodName: string
): XLSX.WorkBook {
  if (!exams || exams.length === 0) {
    throw new Error("No exam data provided");
  }

  // Extract common data from the first exam
  const { subject, subjectCode, className } = exams[0];
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const wsData = [];
  
  // Add header information
  wsData.push(["Subject", subject]);
  wsData.push(["Class", className]);
  wsData.push(["Period", periodName]);
  wsData.push([]);
  
  // Create header row with exam types instead of names
  const headerRow = ["Index Number", "Student Name"];
  
  // Store exam IDs in a hidden property in the worksheet
  const examIds = {};
  
  exams.forEach((exam, index) => {
    // Use exam type instead of name for column header
    const examType = exam.examTypeName || "Exam";
    headerRow.push(`${examType} ${exam.subject.name} ${exam.class.name}`);
    
    // Store exam ID with column index for later retrieval
    examIds[index + 2] = exam.id; // +2 because first two columns are index number and name
  });
  
  wsData.push(headerRow);
  
  // Add total marks row
  const marksRow = ["", "Total Marks"];
  exams.forEach(exam => {
    marksRow.push(exam.totalMarks.toString());
  });
  wsData.push(marksRow);
  
  // Extract all unique students from exams
  const allStudents = getAllUniqueStudents(exams);
  
  // Add student rows
  allStudents.forEach(student => {
    const row = [
      student.indexNumber,
      student.name
    ];
    
    // Add empty cells for scores
    exams.forEach(() => {
      row.push(0);
    });
    
    wsData.push(row);
  });
  
  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidth = [
    { wch: 15 }, // Index Number
    { wch: 30 }, // Student Name
  ];
  exams.forEach(() => {
    colWidth.push({ wch: 15 }); // Width for each exam column
  });
  ws['!cols'] = colWidth;
  
  // Store exam IDs in a hidden custom property
  ws['!examIds'] = examIds;
  
  // Apply cell protection - only allow editing score cells
  ws['!protect'] = {
    password: '', // No password for simplicity
    sheet: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
    objects: false,
    scenarios: false
  };
  
  // Define editable cells (only score cells)
  const editableCells = {};
  
  // Start from row 7 (after headers) and column C (after index and name)
  for (let col = 2; col < 2 + exams.length; col++) {
    for (let row = 6; row < 6 + allStudents.length; row++) {
      const cellRef = XLSX.utils.encode_cell({r: row, c: col});
      editableCells[cellRef] = {locked: false};
    }
  }
  
  ws['!protection'] = editableCells;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Exam Scores");
  
  return wb;
}

// Function to trigger Excel download
export function downloadExcel(filename: string, workbook: XLSX.WorkBook): void {
  // Write workbook to binary string
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to array buffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create Blob from array buffer
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  
  // Create URL for Blob
  const url = URL.createObjectURL(blob);
  
  // Create link element
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.xlsx`);
  
  // Append the link to the body (required for Firefox)
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}