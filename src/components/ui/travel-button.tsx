import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "ghost-light" | "disabled";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function TravelButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "ghost-light"
          ? "btn-ghost-light"
          : "btn-disabled";

  return (
    <button
      type="button"
      className={`btn btn-${size} ${variantClass} ${className}`.trim()}
      disabled={variant === "disabled" || props.disabled}
      {...props}
    >
      {children}
    </button>
  );
}
