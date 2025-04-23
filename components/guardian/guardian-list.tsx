"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { CreateGuardianModal } from "./create-guardian-modal";

interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string;
  emergencyContact: boolean;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    isPrimary: boolean;
  }[];
  hasUserAccount: boolean;
}

interface GuardianListProps {
  schoolId: string;
}

export default function GuardianList({ schoolId }: GuardianListProps) {
  const router = useRouter();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [filteredGuardians, setFilteredGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [relationshipFilter, setRelationshipFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch guardians data
  useEffect(() => {
    const fetchGuardians = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/guadians?schoolId=${schoolId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch guardians");
        }
        const data = await response.json();
        setGuardians(data);
        setFilteredGuardians(data);
      } catch (error) {
        console.error("Error fetching guardians:", error);
        toast.error("Failed to load guardians");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchGuardians();
    }
  }, [schoolId]);

  // Apply filters and search
  useEffect(() => {
    let result = [...guardians];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        guardian =>
          guardian.firstName.toLowerCase().includes(term) ||
          guardian.lastName.toLowerCase().includes(term) ||
          guardian.email.toLowerCase().includes(term) ||
          guardian.phone.includes(term) ||
          guardian.students.some(
            student =>
              student.firstName.toLowerCase().includes(term) ||
              student.lastName.toLowerCase().includes(term)
          )
      );
    }
    
    // Apply relationship filter
    if (relationshipFilter) {
      result = result.filter(
        guardian => guardian.relationship === relationshipFilter
      );
    }
    
    setFilteredGuardians(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, relationshipFilter, guardians]);

  // Get unique relationships for filter
  const uniqueRelationships = [...new Set(guardians.map(g => g.relationship))].filter(Boolean);

  // Pagination logic
  const totalPages = Math.ceil(filteredGuardians.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGuardians = filteredGuardians.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle guardian creation
  const handleGuardianCreated = async () => {
    // Refresh the guardians list
    try {
      const response = await fetch(`/api/guadians?schoolId=${schoolId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch guardians");
      }
      const data = await response.json();
      setGuardians(data);
      setFilteredGuardians(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error refreshing guardians:", error);
    }
  };

  // Handle guardian view
  const handleViewGuardian = (id: string) => {
    router.push(`/guardian/${id}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>School Guardians</CardTitle>
              <CardDescription>
                Manage guardians for students in your school
              </CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Guardian
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guardians..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {relationshipFilter || "All Relationships"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setRelationshipFilter("")}
                    className={!relationshipFilter ? "bg-secondary" : ""}
                  >
                    All Relationships
                  </DropdownMenuItem>
                  {uniqueRelationships.map((relationship) => (
                    <DropdownMenuItem
                      key={relationship}
                      onClick={() => setRelationshipFilter(relationship)}
                      className={relationshipFilter === relationship ? "bg-secondary" : ""}
                    >
                      {relationship}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Guardians Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <p>Loading guardians...</p>
              </div>
            ) : paginatedGuardians.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || relationshipFilter
                    ? "No guardians match your search or filter criteria."
                    : "No guardians found for this school."}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsModalOpen(true)}
                >
                  Add your first guardian
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGuardians.map((guardian) => (
                        <TableRow key={guardian.id}>
                          <TableCell>
                            <div className="font-medium">
                              {guardian.firstName} {guardian.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{guardian.email}</span>
                              <span className="text-sm text-muted-foreground">
                                {guardian.phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {guardian.relationship}
                              {guardian.emergencyContact && (
                                <Badge variant="outline" className="ml-2">
                                  Emergency
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {guardian.students.map((student) => (
                                <Badge
                                  key={student.id}
                                  variant={student.isPrimary ? "default" : "outline"}
                                >
                                  {student.firstName} {student.lastName}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={guardian.hasUserAccount ? "default" : "outline"}
                            >
                              {guardian.hasUserAccount ? "Active" : "No Account"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewGuardian(guardian.id)}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/guardian/edit/${guardian.id}`)
                                  }
                                >
                                  Edit guardian
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      <strong>
                        {startIndex + 1}-
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredGuardians.length
                        )}
                      </strong>{" "}
                      of <strong>{filteredGuardians.length}</strong> guardians
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Guardian Modal */}
      <CreateGuardianModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleGuardianCreated}
        schoolId={schoolId}
      />
    </div>
  );
} 