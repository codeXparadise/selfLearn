import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none",
  {
    variants: {
      variant: {
        default: "bg-neutral-950 text-white hover:bg-neutral-900 hover:ring-2 hover:ring-orange-500/60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-sm hover:shadow-md hover:shadow-orange-500/15",
        primary: "bg-[#EA4335] text-white hover:bg-gradient-to-r hover:from-[#EA4335] hover:to-orange-500 hover:shadow-md hover:shadow-orange-500/35 hover:scale-102",
        orange: "bg-gradient-to-r from-[#EA4335] to-orange-500 text-white hover:from-orange-600 hover:to-[#EA4335] shadow-sm shadow-orange-500/30 hover:shadow-md hover:shadow-orange-500/40 hover:scale-102",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-orange-500 hover:text-[#EA4335] dark:hover:text-orange-400 hover:bg-orange-50/70 dark:hover:bg-orange-950/30 hover:shadow-sm hover:shadow-orange-500/15",
        secondary: "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-orange-50 dark:hover:bg-neutral-700 hover:text-[#EA4335] dark:hover:text-orange-400 hover:ring-1 hover:ring-orange-500/40",
        ghost: "hover:bg-orange-50/80 dark:hover:bg-orange-950/30 text-neutral-700 dark:text-neutral-300 hover:text-[#EA4335] dark:hover:text-orange-400",
        link: "text-[#EA4335] underline-offset-4 hover:underline hover:text-orange-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9 p-0 rounded-full hover:ring-2 hover:ring-orange-500/50 hover:text-orange-500",
        "icon-sm": "h-7 w-7 p-0 rounded-full hover:ring-2 hover:ring-orange-500/50 hover:text-orange-500",
        "icon-lg": "h-11 w-11 p-0 rounded-full hover:ring-2 hover:ring-orange-500/50 hover:text-orange-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

