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
  const examHeaders = ['Number', 'Index Number', 'Student Name'];
  const marksRow = ['', '', ''];
  
  // Add each exam as a column
  exams.forEach(exam => {
    examHeaders.push(exam.name);
    marksRow.push(exam.totalMarks.toString());
  });
  
  // Add a total column if there are multiple exams
  if (exams.length > 1) {
    examHeaders.push('Total');
    marksRow.push('');
  }
  
  headerRows.push(examHeaders.join(','));
  headerRows.push(marksRow.join(','));
  
  // Create data rows for each student
  const studentRows = allStudents.map((student, index) => {
    const row = [
      (index + 1).toString(),
      student.indexNumber,
      `"${student.name}"` // Quote the name to handle commas
    ];
    
    // Add an empty cell (default to 0) for each exam
    exams.forEach(() => row.push('0'));
    
    // Add empty cell for total if needed
    if (exams.length > 1) {
      row.push('0');
    }
    
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
        
        // Find the header row (contains exam names)
        const headerRowIndex = lines.findIndex(line => 
          line.includes('Index Number') && 
          line.includes('Student Name')
        );
        
        if (headerRowIndex === -1) {
          throw new Error("Invalid file format: Header row not found");
        }
        
        // Parse header row to identify columns
        const headers = parseCSVRow(lines[headerRowIndex]);
        
        // Find positions of key columns
        const indexNumPos = headers.findIndex(h => 
          h.toLowerCase().includes('index number'));
        
        if (indexNumPos === -1) {
          throw new Error("Invalid file format: Index Number column not found");
        }
        
        // Create a map of exam names to exam objects
        const examMap = new Map(
          exams.map(exam => [exam.name.trim(), exam])
        );
        
        // Identify which columns contain exam scores
        const examColumns: { name: string; index: number; examId: string }[] = [];
        
        headers.forEach((header, index) => {
          const exam = examMap.get(header.trim());
          if (exam) {
            examColumns.push({
              name: header.trim(),
              index,
              examId: exam.id
            });
          }
        });
        
        if (examColumns.length === 0) {
          throw new Error("No matching exam columns found in file");
        }
        
        // Parse data rows
        const dataRows = lines.slice(headerRowIndex + 1);
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