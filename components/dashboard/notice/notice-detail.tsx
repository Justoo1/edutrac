import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function NoticeDetail() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        <img src="/placeholder.svg?height=160&width=500" alt="Students" className="h-full w-full object-cover" />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold">Welcome Back to School!</h2>
        <p className="text-sm text-muted-foreground">By Principal Linda Carter</p>
        <p className="mt-1 text-sm text-muted-foreground">August 1, 2024</p>
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            As we embark on another exciting academic year, let's embrace the opportunities that lie ahead. We're
            thrilled to welcome new faces and reunite with returning students. Don't miss our opening assembly on August
            5th!
          </p>
          <p className="text-sm">
            Attention students! To support your exam preparation, the library will offer extended hours starting
            September 15th. Join us for additional study sessions and access thousands of resources. Please bring and
            collect over 2,000 pounds of food for local food banks.
          </p>
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium">Tag</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-purple-50">
              School
            </Badge>
            <Badge variant="outline" className="bg-sky-50">
              Academic
            </Badge>
            <Badge variant="outline" className="bg-amber-50">
              Student
            </Badge>
          </div>
        </div>
        <div className="mt-6">
          <Button className="w-full">Read Full Page</Button>
        </div>
      </div>
    </div>
  )
}

