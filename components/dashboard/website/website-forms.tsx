"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput, Plus, Eye, Edit, Trash2 } from "lucide-react";

interface WebsiteFormsProps {
  schoolId: string;
}

export function WebsiteForms({ schoolId }: WebsiteFormsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Forms</h2>
          <p className="text-muted-foreground">
            Create and manage contact forms, application forms, and surveys
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FormInput className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No forms created yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first form to start collecting information from visitors
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Form
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
