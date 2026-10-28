import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
        secondary:
          "border-transparent bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200",
        primary:
          "border-transparent bg-red-100 dark:bg-red-950/60 text-[#EA4335]",
        destructive:
          "border-transparent bg-red-500 text-white",
        outline: "text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800",
        success: "border-transparent bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

