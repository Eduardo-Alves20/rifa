import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <>
      <div className="bg-fx" aria-hidden>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="grid-lines" />
      </div>

      <div className="lp">
        {/* Nav */}
        <nav className="lp-container lp-nav">
          <Link href="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <div className="lp-nav-links">
            <a className="lp-link-muted" href="#como">
              Como funciona
            </a>
            <Link href="/login" className="btn btn-outline">
              Entrar
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="lp-container lp-hero">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              Rifas para lojas físicas
            </span>
            <h1 className="display">
              Cada compra vira
              <br />
              uma <span className="text-grad">chance de ganhar.</span>
            </h1>
            <p className="lead">
              Seus clientes ganham cupons na loja, escolhem os números e acompanham o
              sorteio ao vivo. Tudo digital, auditável e sem complicação.
            </p>
            <div className="hero-cta">
              <Link href="/login" className="btn btn-gold btn-lg">
                Entrar na minha conta
              </Link>
              <Link href="/resgatar" className="btn btn-outline btn-lg">
                Tenho um cupom →
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                Sorteio auditável
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Números únicos
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Ao vivo
              </span>
            </div>
          </div>

          {/* Ticket */}
          <div className="ticket">
            <div className="ticket-top">
              <span className="badge-live">
                <span className="pip" />
                SORTEIO ABERTO
              </span>
              <span style={{ color: "var(--c-text3)", fontSize: 12, fontWeight: 600 }}>
                #NATAL-2026
              </span>
            </div>
            <div className="prize">
              <div className="emoji">📱</div>
              <div className="pname">iPhone 16 Pro 256GB</div>
              <div className="pmeta">Sorteio dia 24/12 · ao vivo</div>
            </div>
            <div className="prog-bar">
              <i style={{ width: "72%" }} />
            </div>
            <div className="prog-meta">
              <span>
                <b>360</b> de 500 números
              </span>
              <span>
                <b>72%</b> vendido
              </span>
            </div>
            <div className="mini-grid">
              {MINI_CELLS.map((state, i) => (
                <div key={i} className={`mini-cell ${state}`}>
                  {String(i + 1).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Como funciona */}
        <section className="lp-container lp-section" id="como">
          <div className="sec-head">
            <div className="kicker">Como funciona</div>
            <h2 className="h-section">Da compra ao prêmio em 4 passos</h2>
            <p className="sec-sub">Simples para o cliente, automático para a loja.</p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.title}>
                <div className="num">{i + 1}</div>
                {i < STEPS.length - 1 ? <div className="connector" /> : null}
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="lp-container lp-section" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div className="kicker">Por que confiar</div>
            <h2 className="h-section">Feito para ser justo e transparente</h2>
          </div>
          <div className="feats">
            {FEATURES.map((f) => (
              <div className="feat" key={f.title}>
                <div className="ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ganhadores */}
        <section className="lp-container lp-section" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div className="kicker">Prova social</div>
            <h2 className="h-section">Quem já levou pra casa</h2>
            <p className="sec-sub">Sorteios reais, ganhadores de verdade.</p>
          </div>
          <div className="carousel">
            {WINNERS.map((w) => (
              <div className="carousel-item" key={w.nome} style={{ width: 260 }}>
                <div className="feat" style={{ height: "100%" }}>
                  <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                    <span className="winner-avatar">{w.nome[0]}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{w.nome}</div>
                      <div className="text-xs text-text-3">{w.cidade}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 28 }}>{w.emoji}</div>
                  <h3 style={{ marginTop: 4 }}>{w.premio}</h3>
                  <p>
                    Número <b style={{ color: "var(--c-yellow)" }}>{w.numero}</b> · {w.data}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="lp-container cta-band">
          <div className="cta-inner">
            <h2>Pronto pra começar?</h2>
            <p>Entre na sua conta ou resgate seu cupom agora mesmo.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-gold btn-lg">
                Entrar
              </Link>
              <Link href="/primeiro-acesso" className="btn btn-outline btn-lg">
                Primeiro acesso
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-container lp-foot-inner">
            <Logo size="sm" />
            <div>SorteioFácil · Pem Tech · v1.0</div>
          </div>
        </footer>
      </div>
    </>
  );
}

const MINI_CELLS = [
  "taken", "taken", "free", "taken", "sel", "free", "taken", "free",
  "free", "taken", "free", "sel", "taken", "free", "taken", "free",
] as const;

const WINNERS = [
  { nome: "Carla M.", cidade: "Belo Horizonte, MG", emoji: "📱", premio: "iPhone 15", numero: "087", data: "Dez/2025" },
  { nome: "Rafael S.", cidade: "Curitiba, PR", emoji: "🛵", premio: "Moto Honda Pop", numero: "212", data: "Nov/2025" },
  { nome: "Júlia P.", cidade: "Recife, PE", emoji: "📺", premio: 'Smart TV 55"', numero: "045", data: "Out/2025" },
  { nome: "Diego A.", cidade: "Porto Alegre, RS", emoji: "🎮", premio: "PlayStation 5", numero: "319", data: "Set/2025" },
  { nome: "Bianca L.", cidade: "Salvador, BA", emoji: "💻", premio: "Notebook Dell", numero: "164", data: "Ago/2025" },
];

const STEPS = [
  { title: "Compre na loja", text: "A cada valor em compras, o cliente recebe um cupom com QR Code." },
  { title: "Resgate o cupom", text: "Escaneia o QR ou digita o código e entra na rifa em segundos." },
  { title: "Escolha os números", text: "Seleciona os números livres no grid. Reserva garantida e única." },
  { title: "Sorteio ao vivo", text: "Acompanha o sorteio transparente em tempo real e torce pelo prêmio." },
];

const FEATURES = [
  {
    title: "Sorteio auditável",
    text: "Algoritmo seguro e registro de cada sorteio com data, hora e responsável.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
      </svg>
    ),
  },
  {
    title: "Número único",
    text: "Trava em tempo real impede que dois clientes peguem o mesmo número.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    ),
  },
  {
    title: "Cupom com QR",
    text: "Colaboradores geram cupons na hora, direto do balcão da loja.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 3l-4 4-4-4" />
      </svg>
    ),
  },
  {
    title: "Painel completo",
    text: "Acompanhe vendas, números restantes e ranking de colaboradores.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
];
