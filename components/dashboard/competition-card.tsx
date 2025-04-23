import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CompetitionCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">Competition</CardTitle>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-bold">3,000</h2>
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
            8%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Competition</p>
      </CardContent>
      <div className="absolute right-0 bottom-0">
        <div className="h-24 w-24 bg-yellow-500/20 rounded-tl-full flex items-end justify-end">
          <Trophy className="h-12 w-12 text-yellow-500 m-4" />
        </div>
      </div>
    </Card>
  );
}