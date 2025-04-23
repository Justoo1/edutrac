import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Edit, Trash, View } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function FeesTable() {
  const fees = [
    {
      id: "2015-02-017",
      name: "Sophia Wilson",
      class: "11A",
      tuition: "$4,500",
      activities: "$300",
      miscellaneous: "$200",
      amount: "$5,000",
      status: "Paid",
    },
    {
      id: "2015-01-016",
      name: "Ethan Lee",
      class: "10B",
      tuition: "$4,500",
      activities: "$250",
      miscellaneous: "$150",
      amount: "$4,900",
      status: "Pending",
    },
    {
      id: "2015-03-012",
      name: "Michael Brown",
      class: "12 AP Calculus",
      tuition: "$4,800",
      activities: "$300",
      miscellaneous: "$200",
      amount: "$5,300",
      status: "Paid",
    },
    {
      id: "2015-01-019",
      name: "Ava Smith",
      class: "9B",
      tuition: "$4,500",
      activities: "$250",
      miscellaneous: "$100",
      amount: "$4,850",
      status: "Overdue",
    },
    {
      id: "2015-01-004",
      name: "Lucas Johnson",
      class: "11A",
      tuition: "$4,500",
      activities: "$300",
      miscellaneous: "$200",
      amount: "$5,000",
      status: "Paid",
    },
    {
      id: "2015-03-015",
      name: "Isabella Garcia",
      class: "8B",
      tuition: "$4,200",
      activities: "$200",
      miscellaneous: "$150",
      amount: "$4,550",
      status: "Pending",
    },
    {
      id: "2015-02-014",
      name: "Oliver Martinez",
      class: "Drama Club",
      tuition: "$4,500",
      activities: "$350",
      miscellaneous: "$100",
      amount: "$4,950",
      status: "Paid",
    },
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-amber-100 text-amber-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Tuition Fee</TableHead>
            <TableHead>Activities Fee</TableHead>
            <TableHead>Miscellaneous</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <TableRow key={fee.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {fee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{fee.name}</div>
                    <div className="text-xs text-muted-foreground">{fee.id}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{fee.class}</TableCell>
              <TableCell>{fee.tuition}</TableCell>
              <TableCell>{fee.activities}</TableCell>
              <TableCell>{fee.miscellaneous}</TableCell>
              <TableCell>{fee.amount}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(fee.status)}`}
                >
                  {fee.status}
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
        <div className="text-sm">Page 1 of 12</div>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  )
}

