"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { BookmarkPlus, Check, X } from "lucide-react";
import { lookupTranslation, type LookupResult } from "@/lib/vocab/lookup";
import {
  addUnknownWord,
  hasUnknownWord,
} from "@/lib/vocab/unknown-words-store";
import type { UnknownWordSource } from "@/types/unknown-words";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  /** Container that the selection must originate inside of. */
  containerRef: RefObject<HTMLElement | null>;
  /** Where the saved entries should be tagged from. Default: "reading". */
  source?: UnknownWordSource;
}

interface PopupState {
  lookup: LookupResult;
  x: number;
  y: number;
  alreadySaved: boolean;
}

const POPUP_MAX_WIDTH = 280;
const POPUP_GAP = 8;

function clampX(x: number): number {
  if (typeof window === "undefined") return x;
  const margin = 8;
  return Math.max(
    margin,
    Math.min(window.innerWidth - POPUP_MAX_WIDTH - margin, x),
  );
}

export default function SelectionTranslator({
  containerRef,
  source = "reading",
}: Props) {
  const { t, lang } = useLang();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setPopup(null), []);

  const handleSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    // Ensure the selection is fully inside the container.
    if (!container.contains(range.commonAncestorContainer)) return;

    const text = sel.toString().trim();
    if (!text || text.length > 120) return;

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const lookup = lookupTranslation(text);
    const alreadySaved = hasUnknownWord(lookup.source);

    setPopup({
      lookup,
      x: clampX(rect.left + window.scrollX),
      y: rect.bottom + window.scrollY + POPUP_GAP,
      alreadySaved,
    });
  }, [containerRef]);

  // Bind selection listeners to the document so we catch the mouseup that ends
  // the selection (which can occur outside the container).
  useEffect(() => {
    function onPointerUp() {
      // Allow the selection to settle before reading it.
      window.setTimeout(handleSelection, 0);
    }
    function onKeyUp(e: KeyboardEvent) {
      // Trigger only on selection-extending keys.
      if (
        e.shiftKey ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "End" ||
        e.key === "Home"
      ) {
        window.setTimeout(handleSelection, 0);
      }
    }
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchend", onPointerUp);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [handleSelection]);

  // Close on outside click / escape / scroll.
  useEffect(() => {
    if (!popup) return;
    function onDocPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      // Allow text-selection clicks inside the container to dismiss the popup —
      // a new selection will re-open it via handleSelection.
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onScroll() {
      close();
    }
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("touchstart", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("touchstart", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [popup, close]);

  const handleSave = useCallback(
    (status: "unknown" | "known") => {
      if (!popup) return;
      addUnknownWord({
        word: popup.lookup.source,
        translation: popup.lookup.translation,
        source,
        status,
      });
      setPopup((p) => (p ? { ...p, alreadySaved: true } : p));
    },
    [popup, source],
  );

  const popupNode = useMemo(() => {
    if (!popup) return null;
    return (
      <div
        ref={popupRef}
        role="dialog"
        aria-label={lang === "he" ? "תרגום" : "Translation"}
        style={{
          position: "absolute",
          top: popup.y,
          left: popup.x,
          maxWidth: POPUP_MAX_WIDTH,
          minWidth: 200,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          boxShadow: "var(--shadow-md)",
          padding: "0.75rem 0.875rem",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              dir="ltr"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--ink)",
                wordBreak: "break-word",
              }}
            >
              {popup.lookup.source}
            </div>
            <div
              dir="rtl"
              style={{
                fontSize: "0.88rem",
                color: "var(--ink-soft)",
                marginTop: 2,
                wordBreak: "break-word",
              }}
            >
              {popup.lookup.translation}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.selectionPopup.close}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ink-muted)",
              cursor: "pointer",
              padding: 2,
              borderRadius: 6,
              display: "inline-flex",
            }}
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            borderTop: "1px solid var(--line)",
            paddingTop: "0.5rem",
          }}
        >
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={() => handleSave("unknown")}
            disabled={popup.alreadySaved}
            style={{ flex: 1 }}
          >
            <BookmarkPlus size={12} strokeWidth={2.2} />
            {popup.alreadySaved ? t.selectionPopup.saved : t.selectionPopup.addToUnknown}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => handleSave("known")}
            disabled={popup.alreadySaved}
            style={{ flex: 1 }}
          >
            <Check size={12} strokeWidth={2.2} />
            {t.selectionPopup.markKnown}
          </button>
        </div>
      </div>
    );
  }, [popup, close, handleSave]);

  if (!mounted || !popupNode) return null;
  return createPortal(popupNode, document.body);
}
