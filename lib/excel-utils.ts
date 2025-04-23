/**
 * Excel Export Utilities for EduTrac
 */

interface Student {
  id: string;
  name: string;
  indexNumber: string;
  status: "present" | "absent" | "exempted" | "sick" | "assigned";
  score?: number | null;
  grade?: string | null;
}

interface ExamExportData {
  examName: string;
  subject: string;
  className: string;
  examDate: string;
  totalMarks: number;
  students: Student[];
}

interface ParsedScore {
  indexNumber: string;
  score: number;
  remarks?: string;
  examId?: string; // Track which exam this score belongs to
}

interface MultiExamData {
  subject: string;
  className: string;
  period: string;
  exams: {
    id: string;
    name: string;
    totalMarks: number;
    date: string;
  }[];
  students: Student[];
}

/**
 * Generate CSV content for exam scores template
 * 
 * @param data Exam data with student information
 * @returns CSV string content
 */
export function generateExamScoresTemplate(data: ExamExportData): string {
  // Create header row with metadata
  const headerRows = [
    `Exam Name,${data.examName}`,
    `Subject,${data.subject}`,
    `Class,${data.className}`,
    `Date,${data.examDate}`,
    `Total Marks,${data.totalMarks}`,
    '',
    'Index Number,Student Name,Score,Remarks'
  ];

  // Create data rows for each student
  const studentRows = data.students.map(student => {
    return `${student.indexNumber},"${student.name}",,`;
  });

  // Combine all rows and return as CSV string
  return [...headerRows, ...studentRows].join('\n');
}

/**
 * Generate CSV content for multiple exam scores template
 * 
 * @param data Multiple exam data with student information
 * @returns CSV string content
 */
export function generateMultiExamScoresTemplate(data: MultiExamData): string {
  // Create header rows
  const headerRows = [
    `Subject,${data.subject}`,
    `Class,${data.className}`,
    `Period,${data.period}`,
    ''
  ];

  // Create the column headers with exam types and their total marks
  const examHeaders = ['Number', 'Index Number', 'Student Name'];
  const totalMarksRow = ['', '', ''];
  
  // Add each exam as a column
  data.exams.forEach(exam => {
    examHeaders.push(exam.name);
    totalMarksRow.push(exam.totalMarks.toString());
  });

  // Add the "Total" column at the end if there are multiple exams
  if (data.exams.length > 1) {
    examHeaders.push('Total');
    totalMarksRow.push('');
  }
  
  // Add the headers to the rows
  headerRows.push(examHeaders.join(','));
  headerRows.push(totalMarksRow.join(','));
  
  // Create data rows for each student
  const studentRows = data.students.map((student, index) => {
    const studentInfo = [index + 1, student.indexNumber, `"${student.name}"`];
    
    // Add empty cells for each exam column
    data.exams.forEach(() => studentInfo.push('0'));
    
    // Add an empty cell for the total column if needed
    if (data.exams.length > 1) {
      studentInfo.push('0');
    }
    
    return studentInfo.join(',');
  });
  
  // Combine all rows and return as CSV string
  return [...headerRows, ...studentRows].join('\n');
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
 * Format date for file naming
 * 
 * @param date Date string
 * @returns Formatted date string for filenames (YYYY-MM-DD)
 */
export function formatDateForFileName(date: string): string {
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  } catch (error) {
    return 'unknown-date';
  }
}

/**
 * Parse CSV content from uploaded file
 * 
 * @param file The uploaded CSV file
 * @returns Promise that resolves to parsed student scores
 */
export function parseScoresCSV(file: File): Promise<ParsedScore[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split('\n');
        
        // Find the header line (should contain "Index Number,Student Name,Score,Remarks")
        const headerLineIndex = lines.findIndex(line => 
          line.includes('Index Number') && line.includes('Student Name') && line.includes('Score')
        );
        
        if (headerLineIndex === -1) {
          throw new Error('Invalid CSV format: Header row not found');
        }
        
        // Parse data rows (all rows after the header)
        const dataRows = lines.slice(headerLineIndex + 1);
        
        const parsedScores: ParsedScore[] = [];
        
        for (const row of dataRows) {
          if (row.trim() === '') continue; // Skip empty rows
          
          const columns = parseCSVRow(row);
          
          // Expected format: Index Number, Student Name, Score, Remarks
          const indexNumber = columns[0]?.trim();
          const scoreStr = columns[2]?.trim();
          const score = parseFloat(scoreStr);
          const remarks = columns[3]?.trim();
          
          // Skip rows with missing index number or invalid score
          if (!indexNumber || isNaN(score)) continue;
          
          parsedScores.push({
            indexNumber,
            score,
            remarks: remarks || undefined
          });
        }
        
        resolve(parsedScores);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse CSV content from an uploaded multi-exam file
 * 
 * @param file The uploaded CSV file
 * @param examMap Object mapping exam names to exam IDs
 * @returns Promise that resolves to parsed student scores with exam IDs
 */
export function parseMultiExamScoresCSV(file: File, examMap: Record<string, string>): Promise<ParsedScore[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split('\n');
        
        // Find the header line (should contain exam names)
        const headerLineIndex = lines.findIndex(line => 
          line.includes('Index Number') && line.includes('Student Name')
        );
        
        if (headerLineIndex === -1) {
          throw new Error('Invalid CSV format: Header row not found');
        }
        
        // Parse the headers to determine which column is which exam
        const headers = parseCSVRow(lines[headerLineIndex]);
        const indexNumberIndex = headers.findIndex(h => h.includes('Index Number'));
        
        if (indexNumberIndex === -1) {
          throw new Error('Invalid CSV format: Index Number column not found');
        }
        
        // Find the column index for each exam
        const examColumns: {name: string, index: number, id: string}[] = [];
        
        headers.forEach((header, index) => {
          const examId = examMap[header.trim()];
          if (examId) {
            examColumns.push({
              name: header.trim(), 
              index, 
              id: examId
            });
          }
        });
        
        if (examColumns.length === 0) {
          throw new Error('No matching exam columns found in the file');
        }
        
        // Parse data rows (all rows after the header)
        const dataRows = lines.slice(headerLineIndex + 1);
        
        const parsedScores: ParsedScore[] = [];
        
        for (const row of dataRows) {
          if (row.trim() === '') continue; // Skip empty rows
          
          const columns = parseCSVRow(row);
          
          // Get the student index number
          const indexNumber = columns[indexNumberIndex]?.trim();
          if (!indexNumber) continue;
          
          // Process each exam column
          for (const examCol of examColumns) {
            const scoreStr = columns[examCol.index]?.trim();
            
            // Skip empty or invalid scores
            if (!scoreStr || scoreStr === '0') continue;
            
            const score = parseFloat(scoreStr);
            if (isNaN(score)) continue;
            
            parsedScores.push({
              indexNumber,
              score,
              examId: examCol.id
            });
          }
        }
        
        resolve(parsedScores);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse a CSV row considering quoted values
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