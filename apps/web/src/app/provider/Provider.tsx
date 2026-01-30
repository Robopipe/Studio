import { store } from "@/store";
import { ThemeProvider } from "@repo/ui";
import { Provider as ReduxProvider } from "react-redux";
import { RouterProvider } from "react-router";
import { router } from "../router";

export const Provider = () => {
  return (
    <ThemeProvider>
      <ReduxProvider store={store}>
        <RouterProvider router={router} />
      </ReduxProvider>
    </ThemeProvider>
  );
};
