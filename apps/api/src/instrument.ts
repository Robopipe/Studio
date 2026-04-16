import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://2ece4005bb2234f5c950004ecf3c4449@o4510783066538064.ingest.de.sentry.io/4511229148004432",
  environment: process.env.APP_ENV || "local",
  sendDefaultPii: true,
});
