"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "./ThemeProvider";

export function DynamicToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          color: theme === "dark" ? "#e5e7eb" : "#111827",
          border: theme === "dark"
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.1)",
          borderRadius: "12px",
          fontSize: "14px",
          boxShadow: theme === "dark"
            ? "0 4px 12px rgba(0,0,0,0.5)"
            : "0 4px 12px rgba(0,0,0,0.1)",
        },
      }}
    />
  );
}
