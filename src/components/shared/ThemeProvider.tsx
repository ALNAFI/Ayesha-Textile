"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

function PreferredTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme && theme !== "light" && theme !== "dark") {
      setTheme("light");
    }
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
      disableTransitionOnChange
    >
      <PreferredTheme />
      {children}
    </NextThemesProvider>
  );
}
