import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>/, so the Pages build needs a
// basePath and a fully static export. Vercel and local dev use the defaults.
const isGithubPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath: "/nextjs-boilerplate",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
