import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { z } from "zod";

// Create a schema for user registration validation
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input
    const validatedData = userSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validatedData.data;
    
    // Create the user
    const user = await createUser(email, password, name, "admin");
    
    // Return success response (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ 
      message: "User registered successfully", 
      user: userWithoutPassword 
    });
  } catch (error: any) {
    // Handle specific errors
    if (error.message === "User already exists with this email") {
      return NextResponse.json(
        { error: "A user with this email already exists" }, 
        { status: 409 }
      );
    }
    
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { error: "Failed to register user" }, 
      { status: 500 }
    );
  }
}