interface BadgeProps {
  variant?: "yellow" | "green" | "red";
  children: React.ReactNode;
}

export function Badge({ variant = "yellow", children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
