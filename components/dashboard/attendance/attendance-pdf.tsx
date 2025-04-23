import { format } from "date-fns"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

interface Student {
  id: string
  name: string
  attendance: {
    date: string
    status: string
  }[]
}

interface AttendancePDFProps {
  students: Student[]
  classInfo: {
    name: string
    teacher: string
  }
  month: string
  weekFilter: string | null
  createdBy: string
  dates: string[]
}

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  headerContainer: {
    marginBottom: 20,
    borderBottom: "2pt solid #000",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  schoolInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
  },
  weekContainer: {
    marginBottom: 20,
  },
  weekHeader: {
    backgroundColor: "#E5E7EB",
    padding: 6,
    marginBottom: 6,
    borderRadius: 4,
  },
  weekTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 24,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 24,
  },
  nameCell: {
    width: "25%",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    justifyContent: "center",
  },
  dateCell: {
    width: "5.42%",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCellLast: {
    width: "5.42%",
    paddingVertical: 6,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 1,
  },
  statusText: {
    fontSize: 10,
    textAlign: "center",
  },
  statusPresent: {
    color: "#059669",
    fontWeight: "bold",
  },
  statusAbsent: {
    color: "#DC2626",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1pt solid #E5E7EB",
    paddingTop: 10,
    fontSize: 8,
    color: "#6B7280",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 8,
    fontSize: 10,
    color: "#6B7280",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
})

function WeekTable({ students, dates, weekNumber }: { 
  students: Student[], 
  dates: string[],
  weekNumber: number | null 
}) {
  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>{weekNumber ? `Week ${weekNumber}` : 'All Weeks'}</Text>
      </View>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.nameCell}>
            <Text style={styles.dateText}>Student Name</Text>
          </View>
          {dates.map((date, index) => (
            <View 
              key={date} 
              style={index === dates.length - 1 ? styles.dateCellLast : styles.dateCell}
            >
              <Text style={styles.dateText}>{format(new Date(date), "dd")}</Text>
            </View>
          ))}
        </View>

        {students.map((student, studentIndex) => (
          <View 
            key={student.id} 
            style={studentIndex === students.length - 1 ? styles.tableRowLast : styles.tableRow}
          >
            <View style={styles.nameCell}>
              <Text>{student.name}</Text>
            </View>
            {dates.map((date, index) => {
              const attendance = student.attendance.find(a => a.date === date)
              return (
                <View 
                  key={date} 
                  style={index === dates.length - 1 ? styles.dateCellLast : styles.dateCell}
                >
                  <Text style={
                    attendance?.status === "present" ? { ...styles.statusText, ...styles.statusPresent } :
                    attendance?.status === "absent" ? { ...styles.statusText, ...styles.statusAbsent } :
                    styles.statusText
                  }>
                    {attendance?.status === "present" ? "P" : 
                     attendance?.status === "absent" ? "A" : "-"}
                  </Text>
                </View>
              )
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.statusPresent}>P</Text>
          <Text> - Present</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.statusAbsent}>A</Text>
          <Text> - Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <Text>-</Text>
          <Text> - Not Marked</Text>
        </View>
      </View>
    </View>
  )
}

export function AttendancePDF({ students, classInfo, month, weekFilter, createdBy, dates }: AttendancePDFProps) {
  try {
    const monthYear = format(new Date(month), "MMMM yyyy")

    // If no week filter, show all dates in a single table
    if (!weekFilter) {
      return (
        <Document>
          <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Attendance Sheet</Text>
              <View style={styles.schoolInfo}>
                <View>
                  <Text style={styles.infoText}>Class: {classInfo.name}</Text>
                  <Text style={styles.infoText}>Class Teacher: {classInfo.teacher}</Text>
                </View>
                <View>
                  <Text style={styles.infoText}>Period: {monthYear}</Text>
                </View>
              </View>
            </View>

            <WeekTable 
              students={students} 
              dates={dates} 
              weekNumber={null}
            />

            <View style={styles.footer}>
              <Text>Generated by: {createdBy}</Text>
              <Text>Generated on: {format(new Date(), "PPpp")}</Text>
            </View>
          </Page>
        </Document>
      )
    }

    // Group dates by week for week-specific view
    const weeklyDates = dates.reduce((acc, date) => {
      const dayOfMonth = new Date(date).getDate()
      let weekNumber = 1
      if (dayOfMonth > 7 && dayOfMonth <= 14) weekNumber = 2
      else if (dayOfMonth > 14 && dayOfMonth <= 21) weekNumber = 3
      else if (dayOfMonth > 21) weekNumber = 4

      if (!acc[weekNumber]) acc[weekNumber] = []
      acc[weekNumber].push(date)
      return acc
    }, {} as Record<number, string[]>)

    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Attendance Sheet</Text>
            <View style={styles.schoolInfo}>
              <View>
                <Text style={styles.infoText}>Class: {classInfo.name}</Text>
                <Text style={styles.infoText}>Class Teacher: {classInfo.teacher}</Text>
              </View>
              <View>
                <Text style={styles.infoText}>Period: {monthYear}</Text>
              </View>
            </View>
          </View>

          {Object.entries(weeklyDates).map(([weekNumber, weekDates]) => (
            <WeekTable 
              key={weekNumber}
              students={students} 
              dates={weekDates} 
              weekNumber={parseInt(weekNumber)} 
            />
          ))}

          <View style={styles.footer}>
            <Text>Generated by: {createdBy}</Text>
            <Text>Generated on: {format(new Date(), "PPpp")}</Text>
          </View>
        </Page>
      </Document>
    )
  } catch (error) {
    console.error("Error in AttendancePDF:", error)
    throw error
  }
} 