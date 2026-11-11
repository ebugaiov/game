import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "periwinkle" | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-lg border-2 font-semibold transition-[transform,background-color,border-color,color] duration-75 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-750 enabled:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-gold-600 bg-gold-500 text-ink-900 shadow-[0_14px_34px_-20px_rgba(229,174,60,0.95)] hover:border-gold-500 hover:bg-gold-400",
  secondary:
    "border-ink-600 bg-ink-700 text-ink-100 shadow-sm hover:border-ink-550 hover:bg-ink-650",
  outline:
    "border-ink-550 bg-transparent text-ink-300 hover:border-ink-400 hover:bg-ink-700 hover:text-ink-100",
  ghost: "border-transparent bg-transparent text-ink-400 hover:bg-ink-700 hover:text-ink-100",
  periwinkle:
    "border-periwinkle-500 bg-periwinkle-400 text-ink-900 shadow-[0_14px_34px_-20px_rgba(126,136,247,0.95)] hover:border-periwinkle-400 hover:bg-periwinkle-300",
  danger:
    "border-danger-400/60 bg-danger-400/15 text-danger-300 hover:border-danger-400 hover:bg-danger-400/25",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-8 gap-1.5 px-2.5 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-3 text-sm sm:text-base",
  icon: "h-9 w-9 p-0",
};

export function buttonStyles(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className = "",
): string {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, size, className)} {...props} />;
}
