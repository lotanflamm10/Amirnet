/**
 * Smart auto-scroll helpers used by the answer/explanation flow.
 *
 * Design goals:
 *   - Only scroll when the target is actually below the fold (avoid
 *     "aggressive jump" UX antipattern).
 *   - Respect `prefers-reduced-motion` — fall back to instant scroll.
 *   - Be safe to call before mount / on the server (no-op).
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

interface ScrollOptions {
  /**
   * Minimum amount the target is allowed to be below the viewport bottom
   * before we trigger a scroll. Above this threshold we leave the user
   * alone (their context is preserved).
   */
  threshold?: number;
  /** Pixels of extra padding above the element when scrolling. */
  offset?: number;
}

/**
 * Scroll `el` into view, but only if it isn't already comfortably visible.
 * Uses smooth scrolling unless the user requested reduced motion.
 */
export function ensureInView(
  el: Element | null | undefined,
  { threshold = 24, offset = 12 }: ScrollOptions = {},
): void {
  if (!el || typeof window === "undefined") return;

  const rect = el.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const topOffscreen = rect.top < offset;
  const bottomOffscreen = rect.bottom > viewportH - threshold;

  // Already mostly in view → don't touch the scroll position.
  if (!topOffscreen && !bottomOffscreen) return;

  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  const block: ScrollLogicalPosition = topOffscreen ? "start" : "nearest";

  el.scrollIntoView({ behavior, block, inline: "nearest" });
}

/**
 * Focus a button without scroll-jacking the page. `preventScroll` keeps the
 * viewport stable, then we run our smarter `ensureInView` to bring the
 * button into view only if it actually needs it.
 */
export function focusWithoutJump(el: HTMLElement | null | undefined): void {
  if (!el || typeof document === "undefined") return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  ensureInView(el, { threshold: 32 });
}
