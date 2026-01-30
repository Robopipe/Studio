import { ThemeProvider } from "@repo/ui";
import { RouterProvider } from "react-router";
import { router } from "../router";

export const Provider = () => {
  return (
    <ThemeProvider>
      {/* <ReduxProvider store={store}> */}
      <RouterProvider router={router} />
      {/* </ReduxProvider> */}
    </ThemeProvider>
  );
};
