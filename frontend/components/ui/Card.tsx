import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
}

export function Card({ tight, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`card ${tight ? "card-tight" : ""} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
