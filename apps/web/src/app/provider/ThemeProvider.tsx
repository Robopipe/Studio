import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

export type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

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

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
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
      setColorScheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [defaultTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", colorScheme === "dark");
    root.style.colorScheme = colorScheme;
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useColorScheme = (): ColorScheme => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useColorScheme must be used within a ThemeProvider");
  }
  return context.colorScheme;
};

export const useSetColorScheme = (): ((scheme: ColorScheme) => void) => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useSetColorScheme must be used within a ThemeProvider");
  }
  return context.setColorScheme;
};
