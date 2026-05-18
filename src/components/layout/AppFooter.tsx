import Link from "next/link";

export function AppFooter() {
  return (
    <footer style={{
      borderTop: "1px solid var(--line)", padding: "1rem 1.5rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", flexWrap: "wrap",
    }}>
      <p dir="ltr" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-muted)" }}>
        AMIRNET Trainer
      </p>
      <p dir="rtl" style={{ fontSize: "0.7rem", color: "var(--ink-muted)", textAlign: "center", flex: 1 }}>
        כלי הכנה עצמאי לאמירנט · לא קשור לנית · ציונים אינם רשמיים
      </p>
      <div dir="ltr" style={{ display: "flex", gap: "1rem" }}>
        {[{ href: "/legal/privacy", label: "Privacy" }, { href: "/legal/terms", label: "Terms" }, { href: "/pricing", label: "Pricing" }].map(({ href, label }) => (
          <Link key={href} href={href}
            style={{ fontSize: "0.72rem", color: "var(--ink-muted)", textDecoration: "none", transition: "color 0.15s" }}
          >{label}</Link>
        ))}
      </div>
    </footer>
  );
}
