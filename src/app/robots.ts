import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://letsgolive.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/dashboard", "/account", "/tools/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
