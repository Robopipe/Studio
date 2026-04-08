import { store } from "@/store";
import { Provider as ReduxProvider } from "react-redux";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "../router";
import { ThemeProvider } from "./ThemeProvider";

export const Provider = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <ReduxProvider store={store}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </ReduxProvider>
    </ThemeProvider>
  );
};
