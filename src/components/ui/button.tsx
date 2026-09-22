import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:text-red-300",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-2 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md") {
  return [
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition",
    "disabled:cursor-not-allowed disabled:opacity-70",
    VARIANTS[variant],
    SIZES[size],
  ].join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, size)} ${className}`}
      {...props}
    />
  );
}
