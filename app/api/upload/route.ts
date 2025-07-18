// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
// import { getSession } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    // Create a FormData object from the incoming request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const isAllowedType = file.type.startsWith("image/");
    if (!isAllowedType) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const filename = `${nanoid()}.${file.name.split(".").pop()}`;
    
    // Upload to Vercel Blob Storage
    const { url } = await put(filename, file, {
      access: "public",
    });

    // Return the URL of the uploaded image
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}