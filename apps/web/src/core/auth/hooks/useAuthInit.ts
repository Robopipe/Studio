import { useEffect, useRef } from "react";

import { useRefreshTokensMutation } from "../services";
import { useAuth } from "./useAuth";

export const useAuthInit = () => {
  const [refresh] = useRefreshTokensMutation();
  const { isAuthenticated } = useAuth();
  // Note: React.StrictMode remounts the component
  const refreshCalledRef = useRef(false);

  useEffect(() => {
    const refreshCalled = refreshCalledRef.current;

    if (isAuthenticated === null && !refreshCalled) {
      refresh();
      refreshCalledRef.current = true;
    }
  }, [isAuthenticated, refresh]);
};
