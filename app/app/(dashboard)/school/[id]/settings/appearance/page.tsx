import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import va from "@/lib/va";
import Form from "@/components/form";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface School {
  id: string;
  font: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  layout: string | null;
  customCSS: string | null;
  footerContent: string | null;
}

async function handleSubmit(formData: FormData | null, school: string | undefined, key: string | null) {
  "use server";
  
  if (!formData || !school) return;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Not authorized" };
    }

    const data = Object.fromEntries(formData.entries());
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/schools/${school}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to update appearance settings");
    }

    va.track("Updated appearance settings", { id: school });
    return { success: true };
  } catch (error) {
    return { error: "Failed to update appearance settings" };
  }
}

export default async function AppearanceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.id, decodeURIComponent(id)),
  });

  if (!school) {
    return <div>School not found</div>;
  }

  const inputs = [
    {
      name: "font",
      label: "Font",
      type: "select" as const,
      defaultValue: school.font || "font-cal",
      options: [
        { value: "font-cal", label: "Cal Sans" },
        { value: "font-lora", label: "Lora" },
        { value: "font-work", label: "Work Sans" },
      ],
    },
    {
      name: "themeColors",
      label: "Theme Colors",
      type: "color-picker" as const,
      defaultValue: {
        primary: school.primaryColor || "#000000",
        secondary: school.secondaryColor || "#ffffff",
        accent: school.accentColor || "#0066cc",
      },
    },
    {
      name: "layout",
      label: "Layout Style",
      type: "select" as const,
      defaultValue: school.layout || "classic",
      options: [
        { value: "classic", label: "Classic" },
        { value: "modern", label: "Modern" },
        { value: "minimal", label: "Minimal" },
      ],
    },
    {
      name: "customCSS",
      label: "Custom CSS",
      type: "code-editor" as const,
      defaultValue: school.customCSS || "",
      language: "css",
    },
    {
      name: "footerContent",
      label: "Footer Content",
      type: "markdown" as const,
      defaultValue: school.footerContent || "",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Appearance Settings</h2>
        <p className="text-sm text-stone-500">
          Customize the look and feel of your school website.
        </p>
      </div>
      {inputs.map((input) => (
        <Form
          key={input.name}
          title={input.label}
          description={`Configure ${input.label.toLowerCase()}`}
          helpText=""
          inputAttrs={input}
          handleSubmit={handleSubmit}
        />
      ))}
    </div>
  );
}
