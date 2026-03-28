import { cn, getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const colors = getStatusColor(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label || status}
    </span>
  );
}
