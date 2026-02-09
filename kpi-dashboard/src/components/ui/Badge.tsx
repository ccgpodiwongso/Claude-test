"use client";

import { classNames } from "@/lib/format";

const COLORS: Record<string, string> = {
  green:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  gray: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "green",
  completed: "green",
  processing: "blue",
  "on-hold": "yellow",
  pending: "yellow",
  open: "yellow",
  failed: "red",
  cancelled: "red",
  refunded: "red",
  expired: "gray",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  status?: string;
}

export default function Badge({ children, color, status }: BadgeProps) {
  const resolvedColor =
    color || STATUS_COLORS[status || ""] || "gray";
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        COLORS[resolvedColor] || COLORS.gray
      )}
    >
      {children}
    </span>
  );
}
