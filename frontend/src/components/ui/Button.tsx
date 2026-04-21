import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-white text-[#000000] border border-border/50 shadow-sm hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white",
      destructive: "bg-white text-destructive border border-destructive/20 hover:bg-destructive/5 active:bg-destructive active:text-white",
      outline: "border border-border/60 bg-transparent text-[#000000] hover:text-primary hover:bg-primary/[0.03] hover:backdrop-blur-sm active:bg-primary active:text-white",
      secondary: "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-primary active:text-white",
      ghost: "text-[#000000] hover:bg-primary/[0.03] hover:backdrop-blur-sm hover:text-primary active:bg-primary active:text-white",
      link: "text-[#000000] underline-offset-4 hover:text-primary hover:underline",
      accent: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95",
    }

    const sizes: Record<string, string> = {
      default: "h-11 px-6 py-2 rounded-2xl",
      sm: "h-9 rounded-xl px-3 text-xs",
      lg: "h-14 rounded-3xl px-8",
      icon: "h-11 w-11 rounded-2xl",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center white-space-nowrap font-bold ring-offset-background smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
