import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d5eed55bf630bb7bc521fe3e974b7f77@o4510811419508736.ingest.us.sentry.io/4510874386825216",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  debug: false,
});
