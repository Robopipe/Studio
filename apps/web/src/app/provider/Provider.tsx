import { store } from "@/store";
import { Provider as ReduxProvider } from "react-redux";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "../router";

// Sonner's `richColors` uses its own hardcoded palette — override the success
// and error tokens so toasts match the Robopipe brand (emerald / red).
const toasterStyle = {
  "--success-bg": "var(--color-emerald-50)",
  "--success-text": "var(--color-emerald-700)",
  "--success-border": "var(--color-emerald-200)",
  "--error-bg": "var(--color-red-50)",
  "--error-text": "var(--color-red-700)",
  "--error-border": "var(--color-red-200)",
} as React.CSSProperties;

export const Provider = () => {
  return (
    <ReduxProvider store={store}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors style={toasterStyle} />
    </ReduxProvider>
  );
};
