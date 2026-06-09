import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", block, loading, disabled, className = "", children, ...rest },
  ref,
) {
  const variantClass =
    variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-ghost";
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${block ? "btn-block" : ""} ${className}`.trim()}
      {...rest}
    >
      {loading ? "Carregando…" : children}
    </button>
  );
});
