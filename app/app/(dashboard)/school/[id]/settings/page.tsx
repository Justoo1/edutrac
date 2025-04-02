import Form from "@/components/form";
import { updateSchool } from "@/lib/actions";
import DeleteSiteForm from "@/components/form/delete-site-form";
import db from "@/lib/db";

export default async function SiteSettingsIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params
  const data = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.id, decodeURIComponent(id)),
    columns: {
      id: true,
      name: true,
      description: true,
      welcomeMessage: true,
      keywords: true,
      adminId: true,
    },
  });

  if (!data) {
    return <div>School not found</div>;
  }

  return (
    <div className="flex flex-col space-y-6">
      <Form
        title="Name"
        description="The name of your site. This will be used as the meta title on Google as well."
        helpText="Please use 32 characters maximum."
        inputAttrs={{
          name: "name",
          type: "text",
          label: "Site Name",
          defaultValue: data.name,
          placeholder: "My Awesome Site",
          maxLength: 32,
        }}
        handleSubmit={updateSchool}
        school={data}
      />

      <Form
        title="Description"
        description="The description of your site. This will be used as the meta description on Google as well."
        helpText="Include SEO-optimized keywords that you want to rank for."
        inputAttrs={{
          name: "description",
          type: "text",
          label: "Site Description",
          defaultValue: data.description ?? "",
          placeholder: "A blog about really interesting things.",
          maxLength: 160,
        }}
        handleSubmit={updateSchool}
        school={data}
      />

      <Form
        title="Welcome Message"
        description="A welcome message that appears on your homepage."
        helpText="You can use markdown formatting for rich text."
        inputAttrs={{
          name: "welcomeMessage",
          type: "markdown",
          label: "Welcome Message",
          defaultValue: data.welcomeMessage ?? "",
          placeholder: "# Welcome to my site\nThank you for visiting!",
        }}
        handleSubmit={updateSchool}
        school={data}
      />

      <Form
        title="Site Keywords"
        description="Keywords that help with SEO and categorization."
        helpText="Separate keywords with commas."
        inputAttrs={{
          name: "keywords",
          type: "text",
          label: "Site Keywords",
          defaultValue: data.keywords ?? "",
          placeholder: "education, learning, school, courses",
        }}
        handleSubmit={updateSchool}
        school={data}
      />

      <DeleteSiteForm siteName={data.name} school={data} />
    </div>
  );
}
