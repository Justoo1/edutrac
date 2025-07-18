import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Edit, Trash, View } from "lucide-react"
import Image from "next/image"

export function BookTable() {
  const books = [
    {
      id: "2024-LIT-001-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "Great Expectations",
      writer: "Charles Dickens",
      subject: "English Literature",
      class: "Class 12",
      publishDate: "1861",
      status: "Available",
    },
    {
      id: "2024-SCI-002-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "Brief History of Time",
      writer: "Stephen Hawking",
      subject: "Science",
      class: "Class 10-12",
      publishDate: "1988",
      status: "Checked Out",
    },
    {
      id: "2024-HIS-003-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "A People's History of the United States",
      writer: "Howard Zinn",
      subject: "History",
      class: "Class 11-12",
      publishDate: "1980",
      status: "Available",
    },
    {
      id: "2024-MATH-004-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "Calculus Made Easy",
      writer: "Silvanus P. Thompson",
      subject: "Mathematics",
      class: "Class 12",
      publishDate: "1910",
      status: "Available",
    },
    {
      id: "2024-BIO-005-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "The Selfish Gene",
      writer: "Richard Dawkins",
      subject: "Biology",
      class: "Class 11",
      publishDate: "1976",
      status: "Checked Out",
    },
    {
      id: "2024-ART-006-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "The Story of Art",
      writer: "E.H. Gombrich",
      subject: "Art History",
      class: "Class 9-12",
      publishDate: "1950",
      status: "Available",
    },
    {
      id: "2024-CHE-007-01",
      cover: "/placeholder.svg?height=60&width=40",
      name: "Organic Chemistry as a Second Language",
      writer: "David Klein",
      subject: "Chemistry",
      class: "Class 11-12",
      publishDate: "2004",
      status: "Available",
    },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Book ID</TableHead>
            <TableHead>Book Name</TableHead>
            <TableHead>Writer</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Class(es)</TableHead>
            <TableHead>Publish Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>{book.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Image
                    src={book.cover || "/placeholder.svg"}
                    alt={book.name}
                    className="h-10 w-6 rounded border object-cover"
                  />
                  {book.name}
                </div>
              </TableCell>
              <TableCell>{book.writer}</TableCell>
              <TableCell>{book.subject}</TableCell>
              <TableCell>{book.class}</TableCell>
              <TableCell>{book.publishDate}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    book.status === "Available" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}
                >
                  {book.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <View className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-2">
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <div className="flex items-center gap-1 text-sm">
          <Button variant="outline" size="icon" className="h-8 w-8">
            1
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            2
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            3
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            4
          </Button>
          <span>...</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            17
          </Button>
        </div>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  )
}

