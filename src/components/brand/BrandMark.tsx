"use client";
import type { CSSProperties } from "react";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  size?: number;
  showName?: boolean;
  showTagline?: boolean;
  style?: CSSProperties;
}

/**
 * Amirnet Coach brand mark.
 * Renders a minimal geometric "A" path mark with optional product name and tagline.
 * Use showName to show "Amirnet Coach", showTagline to show the localized tagline.
 */
export function BrandMark({ size = 36, showName = true, showTagline = false, style }: Props) {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", ...style }}>
      {/* Mark: geometric A-path representing a route/readiness arc */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M18 5L31 27H5L18 5Z" stroke="var(--teal)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M12 22H24" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>

      {(showName || showTagline) && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          {showName && (
            <div style={{
              fontSize: size > 30 ? "1.125rem" : "0.95rem",
              fontWeight: 800,
              letterSpacing: "0.01em",
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
            }}>
              Amirnet Coach
            </div>
          )}
          {showTagline && (
            <div style={{
              fontSize: "0.68rem",
              color: "var(--ink-muted)",
              marginTop: "0.15rem",
              fontFamily: "var(--font-body)",
            }}>
              {t.home.tagline}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
