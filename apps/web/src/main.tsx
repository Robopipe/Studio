import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

Sentry.init({
  dsn: "https://572544f0533f09bf05012bda684184c2@o4510783066538064.ingest.de.sentry.io/4511229181558864",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
});

const main = async () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

main();
