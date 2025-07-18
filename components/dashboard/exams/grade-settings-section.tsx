"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

// UI Components
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericFormat } from 'react-number-format';

// Grade schema definition (matching the database schema)
interface Grade {
    id: number;
    schoolId: string;
    gradeName: string;
    minScore: number;
    maxScore: number;
    interpretation: string | null;
    gradePoint: string | null; // Stored as numeric(3,1) in DB, treat as string/null here
    createdAt?: string;
    updatedAt?: string;
}

// Zod schema for form validation
const gradeFormSchema = z.object({
    gradeName: z.string().min(1, { message: "Grade name is required." }),
    minScore: z.number({ required_error: "Minimum score is required." }).min(0).max(100),
    maxScore: z.number({ required_error: "Maximum score is required." }).min(0).max(100),
    interpretation: z.string().optional().nullable(),
    gradePoint: z.string().refine(val => val === null || val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 10), {
        message: "Grade point must be a number between 0.0 and 10.0, or empty.",
    }).optional().nullable(),
}).refine(data => data.minScore <= data.maxScore, {
    message: "Minimum score cannot be greater than maximum score.",
    path: ["minScore"], // Apply error to min_score field
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeSettingsSectionProps {
    schoolId: string;
}

export default function GradeSettingsSection({ schoolId }: GradeSettingsSectionProps) {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

    // Form hook
    const form = useForm<GradeFormValues>({
        resolver: zodResolver(gradeFormSchema),
        defaultValues: {
            gradeName: '',
            minScore: 0,
            maxScore: 0,
            interpretation: '',
            gradePoint: '',
        },
    });

    useEffect(() => {
        fetchGrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schoolId]);

    const fetchGrades = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/grade-system?schoolId=${schoolId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch grade settings");
            }
            const data = await response.json();
            setGrades(data);
        } catch (error) {
            console.error("Error fetching grade settings:", error);
            toast.error("Failed to load grade settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddDialog = () => {
        setEditingGrade(null);
        form.reset({ // Reset form for adding
            gradeName: '',
            minScore: 0,
            maxScore: 0,
            interpretation: '',
            gradePoint: '',
        });
        setIsAddEditDialogOpen(true);
    };

    const handleOpenEditDialog = (grade: Grade) => {
        setEditingGrade(grade);
        form.reset({ // Set form values for editing
            gradeName: grade.gradeName,
            minScore: grade.minScore,
            maxScore: grade.maxScore,
            interpretation: grade.interpretation || '',
            gradePoint: grade.gradePoint || '',
        });
        setIsAddEditDialogOpen(true);
    };

    const onSubmit = async (data: GradeFormValues) => {
        setIsSubmitting(true);
        const apiUrl = editingGrade ? `/api/grade-system/${editingGrade.id}` : `/api/grade-system?schoolId=${schoolId}`;
        const method = editingGrade ? "PUT" : "POST";

        const payload = {
            ...data,
            id: editingGrade?.id,
            schoolId,
            gradePoint: data.gradePoint ? parseFloat(data.gradePoint).toFixed(1) : null,
        };

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${editingGrade ? 'update' : 'create'} grade setting`);
            }

            toast.success(`Grade setting ${editingGrade ? 'updated' : 'created'} successfully!`);
            setIsAddEditDialogOpen(false);
            fetchGrades(); // Refresh the list
        } catch (error) {
            console.error(`Error ${editingGrade ? 'updating' : 'creating'} grade setting:`, error);
            toast.error((error as Error).message || `Failed to ${editingGrade ? 'update' : 'create'} grade setting.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (gradeId: number) => {
        try {
            const response = await fetch(`/api/grade-system/${gradeId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete grade setting');
            }

            toast.success('Grade setting deleted successfully!');
            fetchGrades(); // Refresh the list
        } catch (error) {
            console.error('Error deleting grade setting:', error);
            toast.error((error as Error).message || 'Failed to delete grade setting.');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grade Settings</CardTitle>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleOpenAddDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>{editingGrade ? 'Edit Grade Setting' : 'Add New Grade Setting'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="gradeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grade Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., A1, B2, Pass" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="minScore"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min Score (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={0} max={100} {...field} onChange={e => field.onChange(Number(e.target.value))}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maxScore"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Score (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={0} max={100} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="interpretation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Interpretation (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Excellent, Very Good, Fail" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gradePoint"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grade Point (Optional)</FormLabel>
                                             <FormControl>
                                                <NumericFormat
                                                    customInput={Input}
                                                    placeholder="e.g., 4.0, 3.5, 0.0"
                                                    allowNegative={false}
                                                    decimalScale={1}
                                                    fixedDecimalScale
                                                    value={field.value ?? ''}
                                                    onValueChange={(values) => {
                                                        field.onChange(values.value || null);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Used for GPA calculations (e.g., 0.0 to 10.0).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingGrade ? 'Save Changes' : 'Add Grade'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading Grades...</div>
                ) : grades.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No grade settings configured yet.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Grade</TableHead>
                                <TableHead>Score Range (%)</TableHead>
                                <TableHead>Interpretation</TableHead>
                                <TableHead>Grade Point</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grades.map((grade) => (
                                <TableRow key={grade.id}>
                                    <TableCell className="font-medium">{grade.gradeName}</TableCell>
                                    <TableCell>{grade.minScore} - {grade.maxScore}</TableCell>
                                    <TableCell>{grade.interpretation || '-'}</TableCell>
                                    <TableCell>{grade.gradePoint || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleOpenEditDialog(grade)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the grade setting &quot;{grade.gradeName}&quot;.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(grade.id)} className="bg-red-500 hover:bg-red-600">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
} 