// import { headers } from "next/headers";
// import { getSchoolPages } from "@/lib/fetchers";
// import { getWebsitePages } from "@/lib/fetchers";

// export default async function Sitemap() {
//   const headersList = headers();
//   const domain =
//     headersList
//       .get("host")
//       ?.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) ??
//     "vercel.pub";

//   const schoolPages = await getSchoolPages(domain);
//   const websitePages = await getWebsitePages(domain);

//   const pages = [
//     {
//       url: `https://${domain}`,
//       lastModified: new Date(),
//     },
//     ...schoolPages.map((page:any) => ({
//       url: `https://${domain}/${page.slug}`,
//       lastModified: new Date(),
//     })),
//     ...websitePages.map((page:any) => ({
//       url: `https://${domain}/${page.slug}`,
//       lastModified: new Date(),
//     })),
//   ];

//   return pages;
// }