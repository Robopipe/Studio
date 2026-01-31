import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import "../themes/base.scss";
import "../themes/dark/colors.scss";
import "../themes/light/colors.scss";

export type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Detects the system's color scheme preference
 */
const getSystemColorScheme = (): ColorScheme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export interface ThemeProviderProps extends PropsWithChildren {
  defaultTheme?: ColorScheme | "system";
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (defaultTheme === "system") {
      return getSystemColorScheme();
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (defaultTheme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setColorSchemeState(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [defaultTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorScheme);
    document.documentElement.style.colorScheme = colorScheme;
  }, [colorScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to get the current color scheme
 * @returns The current color scheme ("light" or "dark")
 * @throws Error if used outside of ThemeProvider
 */
export const useColorScheme = (): ColorScheme => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useColorScheme must be used within a ThemeProvider");
  }
  return context.colorScheme;
};

/**
 * Hook to get the setColorScheme function
 * @returns Function to update the color scheme
 * @throws Error if used outside of ThemeProvider
 */
export const useSetColorScheme = (): ((scheme: ColorScheme) => void) => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useSetColorScheme must be used within a ThemeProvider");
  }
  return context.setColorScheme;
};
