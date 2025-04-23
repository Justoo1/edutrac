import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OlympicStudentsCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">Olympic Students</CardTitle>
        <Award className="h-5 w-5 text-teal-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-bold">24,680</h2>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            15%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Olympic Students</p>
      </CardContent>
      <div className="absolute right-0 bottom-0">
        <div className="h-24 w-24 bg-teal-500/20 rounded-tl-full flex items-end justify-end">
          <Award className="h-12 w-12 text-teal-500 m-4" />
        </div>
      </div>
    </Card>
  );
}