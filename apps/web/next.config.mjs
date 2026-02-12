import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs outside CI
  silent: !process.env.CI,

  org: "lets-go-live",
  project: "lgl-tools",
});
