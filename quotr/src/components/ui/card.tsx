import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#e4e4e7] shadow-card rounded-card p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
