import Form from "@/components/form";
// import { updateSite } from "@/lib/actions";
import db from "@/lib/db";
import { schools } from "@/lib/schema";

export default async function SiteSettingsDomains({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params
  const data = await db.query.schools.findFirst({
    where: (schools, { eq }) => eq(schools.id, decodeURIComponent(id)),
  });

  return (
    <div className="flex flex-col space-y-6">
      <Form
        title="Subdomain"
        description="The subdomain for your site."
        helpText="Please use 32 characters maximum."
        inputAttrs={{
          name: "subdomain",
          label: "Subdomain",
          type: "text",
          defaultValue: data?.subdomain!,
          placeholder: "subdomain",
          maxLength: 32,
        }}
        handleSubmit={() =>  Promise.resolve({ message: 'Will be created soon' })}
        school={data}
      />
      <Form
        title="Custom Domain"
        description="The custom domain for your site."
        helpText="Please enter a valid domain."
        inputAttrs={{
          name: "customDomain",
          type: "text",
          label: "Custom Domain",
          defaultValue: data?.customDomain!,
          placeholder: "yourdomain.com",
          maxLength: 64,
          // pattern: "^[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}$",
        }}
        handleSubmit={() =>  Promise.resolve({ message: 'Will be created soon' })}
        school={data}
      />
    </div>
  );
}
