import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Class, Subject, Teacher, Schedule, Period } from './timetable-client'

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" }
  ]
})

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    color: "#6B7280",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 40,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    minHeight: 30,
  },
  tableCol: {
    width: "16.67%",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  tableCell: {
    fontSize: 10,
    textAlign: "center",
  },
  timeCol: {
    width: "16.67%",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  timeCell: {
    fontSize: 9,
    textAlign: "center",
    color: "#6B7280",
  },
  subjectText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  teacherText: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 2,
  },
  roomText: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
  },
})

interface TimetablePDFProps {
  schedules: Schedule[]
  classes: Class[]
  subjects: Subject[]
  teachers: Teacher[]
  periods: Period[]
  selectedClass?: string
  selectedTeacher?: string
  selectedTerm?: string
  showRoomNumbers: boolean
  showTeacherNames: boolean
  showClassNames: boolean
  periodDuration: number
  view: string
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function TimetablePDF({
  schedules,
  classes,
  subjects,
  teachers,
  periods,
  selectedClass,
  selectedTeacher,
  selectedTerm,
  showRoomNumbers,
  showTeacherNames,
  showClassNames,
  periodDuration,
  view,
}: TimetablePDFProps) {
  // Filter schedules based on selection
  const filteredSchedules = schedules.filter(schedule => {
    let keep = true
    if (selectedClass) {
      keep = keep && schedule.classId === selectedClass
    }
    if (selectedTeacher) {
      keep = keep && schedule.teacherId === selectedTeacher
    }
    if (selectedTerm) {
      keep = keep && schedule.academicTermId === selectedTerm
    }
    return keep
  })

  // Get header text based on selection
  const getHeaderText = () => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass)
      return `Class Schedule: ${classData?.name || ''}`
    }
    if (selectedTeacher) {
      const teacherData = teachers.find(t => t.id === selectedTeacher)
      return `Teacher Schedule: ${teacherData?.name || ''}`
    }
    return 'Weekly Schedule'
  }

  const renderScheduleCell = (day: string, period: Period) => {
    const schedule = filteredSchedules.find(s => 
      s.day.toLowerCase() === day.toLowerCase() && 
      s.period === period.id
    )
    
    if (!schedule) {
      return (
        <View>
          <Text style={styles.tableCell}>-</Text>
        </View>
      )
    }

    const subject = subjects.find(s => s.id === schedule.subjectId)
    const teacher = teachers.find(t => t.id === schedule.teacherId)
    const classData = classes.find(c => c.id === schedule.classId)

    return (
      <View>
        <Text style={styles.subjectText}>{subject?.name || ''}</Text>
        {showTeacherNames && (
          <Text style={styles.teacherText}>{teacher?.name || ''}</Text>
        )}
        {(showClassNames || showRoomNumbers) && (
          <Text style={styles.roomText}>
            {showClassNames ? `${classData?.name}${showRoomNumbers ? ' - ' : ''}` : ''}
            {showRoomNumbers ? `Room: ${schedule.room}` : ''}
          </Text>
        )}
      </View>
    )
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.header}>{getHeaderText()}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.timeCol}>
              <Text style={styles.tableCell}>Time</Text>
            </View>
            {days.map(day => (
              <View key={day} style={styles.tableCol}>
                <Text style={styles.tableCell}>{day}</Text>
              </View>
            ))}
          </View>

          {periods.map(period => (
            period.type === 'class' ? (
              <View key={period.id} style={styles.tableRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeCell}>{period.time}</Text>
                  <Text style={styles.timeCell}>{period.label}</Text>
                </View>
                {days.map(day => (
                  <View key={day} style={styles.tableCol}>
                    {renderScheduleCell(day, period)}
                  </View>
                ))}
              </View>
            ) : (
              <View key={period.id} style={styles.tableRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeCell}>{period.time}</Text>
                  <Text style={styles.timeCell}>{period.label}</Text>
                </View>
                {days.map(day => (
                  <View key={day} style={styles.tableCol}>
                    <Text style={styles.tableCell}>-</Text>
                  </View>
                ))}
              </View>
            )
          ))}
        </View>
      </Page>
    </Document>
  )
} 