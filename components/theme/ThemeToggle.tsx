"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] w-10 h-10 rounded-xl transition-colors
        dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/25 dark:text-yellow-300
        bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600
        ${className}`}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  );
}
