import Link from "next/link";
import { Logo } from "@/components/Logo";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <>
      <div className="bg-fx" aria-hidden>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="grid-lines" />
      </div>

      <div className="auth-wrap">
        <main className="auth-card">
          <div className="auth-head">
            <Link href="/" aria-label="Início" style={{ display: "inline-flex" }}>
              <Logo size="md" />
            </Link>
            <h1 className="h1">{title}</h1>
            {subtitle ? (
              <p className="text-text-2 text-sm" style={{ marginTop: 6 }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}

          {footer ? <div className="auth-foot">{footer}</div> : null}
        </main>
      </div>
    </>
  );
}
