"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Image as ImageIcon } from "lucide-react";

// Editor toolbar component
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-input p-2 flex flex-wrap gap-2">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => {
          // Create a hidden file input element
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          
          // Handle file selection
          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            try {
              // Show loading state
              toast.loading('Uploading image...');
              
              // Create a FormData instance
              const formData = new FormData();
              formData.append('file', file);
              
              // Upload the image to your server
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error('Failed to upload image');
              }
              
              // Get the uploaded image URL
              const { url } = await response.json();
              
              // Insert the image into the editor
              editor.chain().focus().setImage({ src: url }).run();
              
              toast.dismiss();
              toast.success('Image uploaded successfully');
            } catch (error) {
              console.error('Error uploading image:', error);
              toast.dismiss();
              toast.error('Failed to upload image');
            }
          };
          
          // Trigger the file dialog
          input.click();
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

// TipTap Editor Component
const TipTapEditor = ({ content, onChange }: { content: string; onChange: (html: string) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle file upload
  const uploadImage = async (file: File): Promise<string> => {
    try {
      toast.loading('Uploading image...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const { url } = await response.json();
      
      toast.dismiss();
      toast.success('Image uploaded successfully');
      
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.dismiss();
      toast.error('Failed to upload image');
      throw error;
    }
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Write your content here...',
      }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Handle drag events for image upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!editor) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        // Error is already handled in uploadImage
      }
    }
  };

  return (
    <div 
      className={`relative border rounded-md overflow-hidden ${
        isDragging ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="min-h-[250px] max-h-[350px] overflow-y-auto prose max-w-none p-4 focus:outline-none" 
      />
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-70 flex items-center justify-center rounded-md z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <ImageIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-blue-600 font-medium">Drop image here</p>
          </div>
        </div>
      )}
      <div className="p-2 text-xs text-gray-500 border-t">
        Tip: You can drag and drop images directly into the editor
      </div>
    </div>
  );
};

// Form schema for validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  contentType: z.enum(["announcement", "page", "newsletter"]),
  slug: z.string().optional(),
  published: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSchoolContentButtonProps {
  schoolId: string;
}

export function CreateSchoolContentButton({ schoolId }: CreateSchoolContentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      contentType: "announcement",
      published: false,
    },
  });

  async function onSubmit(formData: FormValues) {
    setIsSubmitting(true);

    try {
      const slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const response: Response = await fetch("/api/schools/create-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          contentType: formData.contentType,
          schoolId,
          slug,
          published: formData.published,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create content");
      }

      const responseData = await response.json();

      toast.success("Content created successfully!");
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-500 text-blue-900 hover:bg-yellow-400">Create Content</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle>Create new content</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <TipTapEditor 
                      content={field.value} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="page">Page</option>
                      <option value="newsletter">Newsletter</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="about-us" 
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Publish"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Publish immediately</FormLabel>
                    <p className="text-sm text-gray-500">
                      If unchecked, content will be saved as a draft.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Content"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}