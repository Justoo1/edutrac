"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  dob: string;
  phoneNumber: string;
  address: string;
  avatar: string;
  initials: string;
}

export function StudentList() {
  const [students] = useState<Student[]>([
    {
      id: "2016-01-001",
      name: "Sarah Miller",
      email: "smiller@eduprofichigh.edu",
      class: "10A",
      dob: "04/18/2008",
      phoneNumber: "(555) 101-0101",
      address: "101 High St, Springfield, IL",
      avatar: "/avatars/sarah.jpg",
      initials: "SM",
    },
    {
      id: "2014-02-002",
      name: "Ethan Brown",
      email: "ebrown@eduprofihigh.edu",
      class: "12",
      dob: "07/22/2006",
      phoneNumber: "(555) 101-0101",
      address: "202 Lake Ave, Springfield, IL",
      avatar: "/avatars/ethan.jpg",
      initials: "EB",
    },
    {
      id: "2017-03-003",
      name: "Olivia Smith",
      email: "osmith@eduprofihigh.edu",
      class: "9B",
      dob: "09/29/2010",
      phoneNumber: "(555) 101-0101",
      address: "303 River Rd, Springfield, IL",
      avatar: "/avatars/olivia.jpg",
      initials: "OS",
    },
    {
      id: "2015-01-004",
      name: "Lucas Johnson",
      email: "ljohnson@eduprofihigh.edu",
      class: "11A",
      dob: "11/03/2009",
      phoneNumber: "(555) 101-0101",
      address: "404 Pine Dr, Springfield, IL",
      avatar: "/avatars/lucas.jpg",
      initials: "LJ",
    },
    {
      id: "2018-02-005",
      name: "Mia Williams",
      email: "mwilliams@eduprofihigh.edu",
      class: "8B",
      dob: "01/19/2007",
      phoneNumber: "(555) 101-0101",
      address: "505 Maple Ln, Springfield, IL",
      avatar: "/avatars/mia.jpg",
      initials: "MW",
    },
    {
      id: "2015-03-006",
      name: "Noah Davis",
      email: "ndavis@eduprofihigh.edu",
      class: "9C",
      dob: "05/05/2010",
      phoneNumber: "(555) 101-0101",
      address: "606 Birch Blvd, Springfield, IL",
      avatar: "/avatars/noah.jpg",
      initials: "ND",
    },
    {
      id: "2019-01-007",
      name: "Emma Wilson",
      email: "ewilson@eduprofihigh.edu",
      class: "7C",
      dob: "02/20/2007",
      phoneNumber: "(555) 101-0101",
      address: "707 Cedar Ct, Springfield, IL",
      avatar: "/avatars/emma.jpg",
      initials: "EW",
    },
    {
      id: "2017-02-008",
      name: "Liam Thompson",
      email: "lthompson@eduprofihigh.edu",
      class: "10B",
      dob: "08/28/2011",
      phoneNumber: "(555) 101-0101",
      address: "808 Walnut St, Springfield, IL",
      avatar: "/avatars/liam.jpg",
      initials: "LT",
    },
    {
      id: "2016-03-009",
      name: "Ava Garcia",
      email: "agarcia@eduprofihigh.edu",
      class: "11A",
      dob: "03/15/2009",
      phoneNumber: "(555) 101-0101",
      address: "909 Spruce Way, Springfield, IL",
      avatar: "/avatars/ava.jpg",
      initials: "AG",
    },
    {
      id: "2018-01-010",
      name: "James Martinez",
      email: "jmartinez@eduprofihigh.edu",
      class: "7B",
      dob: "12/12/2008",
      phoneNumber: "(555) 101-0101",
      address: "1010 Fir St, Springfield, IL",
      avatar: "/avatars/james.jpg",
      initials: "JM",
    },
  ]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox />
            </TableHead>
            <TableHead className="w-[250px]">Student Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>{student.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-gray-500">{student.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{student.id}</TableCell>
              <TableCell>{student.class}</TableCell>
              <TableCell>{student.dob}</TableCell>
              <TableCell>{student.phoneNumber}</TableCell>
              <TableCell>{student.address}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between space-x-2 py-4 px-6">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">10</span> of{" "}
          <span className="font-medium">100</span> entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[2rem] px-2 sm:px-3"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[2rem] px-2 sm:px-3"
          >
            2
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[2rem] px-2 sm:px-3"
          >
            3
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[2rem] px-2 sm:px-3"
          >
            4
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}