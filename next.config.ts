import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The My Resume lab moved: keep old links and bookmarks working.
  redirects: async () => [{ source: "/myresume", destination: "/test-resume-job-match", permanent: true }],
  turbopack: {
    // Pin the workspace root so a stray lockfile in a parent directory is not picked up.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
