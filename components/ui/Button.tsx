"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:active:bg-gray-300",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/25 dark:border-white/10",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:active:bg-red-500/30 dark:border-red-500/20",
  ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 dark:active:bg-white/10",
};

// Mobile-optimized: minimum 44px touch targets
const sizes = {
  sm: "px-3 py-2 text-xs min-h-[36px] sm:min-h-[32px]",
  md: "px-4 py-2.5 text-sm min-h-[44px] sm:min-h-[40px]",
  lg: "px-6 py-3.5 text-base min-h-[48px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as Record<string, unknown>)}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
