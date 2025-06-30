import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus-visible:ring-blue-500 active:scale-95",
        primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-[1.02] focus-visible:ring-blue-500 active:scale-95",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl hover:shadow-red-500/25 transform hover:scale-[1.02] focus-visible:ring-red-500 active:scale-95",
        outline: "border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-300 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transform hover:scale-[1.02] focus-visible:ring-gray-500 active:scale-95",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] focus-visible:ring-gray-500 active:scale-95",
        ghost: "hover:bg-gray-100/80 text-gray-700 hover:text-gray-900 backdrop-blur-sm transform hover:scale-[1.02] focus-visible:ring-gray-500 active:scale-95",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus-visible:ring-blue-500",
        success: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25 transform hover:scale-[1.02] focus-visible:ring-green-500 active:scale-95",
        warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:shadow-amber-500/25 transform hover:scale-[1.02] focus-visible:ring-amber-500 active:scale-95",
        premium: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-[1.02] focus-visible:ring-purple-500 active:scale-95 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
      },
      size: {
        xs: "h-7 px-2 py-1 text-xs rounded-lg",
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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