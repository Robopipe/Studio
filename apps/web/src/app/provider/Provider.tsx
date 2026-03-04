import { store } from "@/store";
import { ThemeProvider } from "@repo/ui";
import { Provider as ReduxProvider } from "react-redux";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "../router";

export const Provider = () => {
  return (
    <ThemeProvider>
      <ReduxProvider store={store}>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--typography-text-font-family)",
              fontSize: "var(--typography-text-14-font-size)",
            },
          }}
          style={
            {
              "--normal-bg": "var(--color-background-paper)",
              "--normal-border": "var(--color-gray-300)",
              "--normal-text": "var(--color-text-primary)",
              "--success-bg": "var(--color-background-paper)",
              "--success-border": "var(--color-success)",
              "--success-text": "var(--color-success)",
              "--error-bg": "var(--color-background-paper)",
              "--error-border": "var(--color-error)",
              "--error-text": "var(--color-error)",
            } as React.CSSProperties
          }
        />
      </ReduxProvider>
    </ThemeProvider>
  );
};
