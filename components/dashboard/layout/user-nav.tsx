"use client";

import { Bell, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"

// Define the User type based on the session user structure
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  role: string;
};

export function UserNav({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">
        <MessageSquare className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "User"} />
              <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Button variant="ghost" onClick={() => signOut()}>
              <span><LogOut className="w-4 h-4 mr-2" /> Log out</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

