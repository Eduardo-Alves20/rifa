interface AlertProps {
  variant?: "info" | "success" | "error";
  children: React.ReactNode;
}

export function Alert({ variant = "info", children }: AlertProps) {
  const color =
    variant === "success"
      ? "border-l-[3px] border-[var(--c-green)] bg-[rgba(46,204,113,0.08)]"
      : variant === "error"
        ? "border-l-[3px] border-[var(--c-red)] bg-[rgba(231,76,60,0.08)]"
        : "border-l-[3px] border-[var(--c-yellow)] bg-[var(--c-yellow-dim)]";
  return (
    <div className={`${color} rounded-md px-4 py-3 text-sm text-[var(--c-text)]`} role="alert">
      {children}
    </div>
  );
}
