/**
 * Smart auto-scroll helpers used by the answer/explanation flow.
 *
 * Design goals:
 *   - Only scroll when the target is actually below the fold (avoid
 *     "aggressive jump" UX antipattern).
 *   - Account for the fixed mobile BottomTabBar (~56px + iPhone safe-area
 *     home-indicator inset). Otherwise an element rendered above the
 *     tabbar at sticky-bottom would be wrongly classified "off-screen"
 *     and trigger an unwanted scroll on every answer submission.
 *   - Respect `prefers-reduced-motion` — fall back to instant scroll.
 *   - Be safe to call before mount / on the server (no-op).
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** True when the viewport is mobile-width (< Tailwind lg = 1024px). */
function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 1023px)").matches ?? false;
}

/**
 * Returns the y-coordinate (px from viewport top) of the *effective*
 * viewport bottom — i.e. the lowest pixel a user can comfortably tap
 * before content is hidden behind the fixed mobile bottom tab bar +
 * iPhone home-indicator safe-area inset.
 *
 * Desktop: full window height (no bottom nav).
 */
function effectiveViewportBottom(): number {
  if (typeof window === "undefined") return 0;
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  if (!isMobileViewport()) return viewportH;

  // Read the CSS variable that lives on :root. Falls back to 56px.
  let tabbar = 56;
  try {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--mobile-tabbar-height")
      .trim();
    if (raw.endsWith("px")) {
      const n = parseFloat(raw);
      if (Number.isFinite(n)) tabbar = n;
    }
  } catch { /* keep default */ }

  // iPhone safe-area inset (home indicator). Read by measuring a probe
  // element styled with padding-bottom: env(safe-area-inset-bottom). On
  // browsers that don't support env() we get 0.
  let safeBottom = 0;
  try {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;left:0;bottom:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    safeBottom = parseFloat(cs.paddingBottom) || 0;
    document.body.removeChild(probe);
  } catch { /* keep default */ }

  return viewportH - tabbar - safeBottom;
}

interface ScrollOptions {
  /**
   * Minimum amount the target is allowed to be below the *effective*
   * viewport bottom (above-tabbar) before we trigger a scroll. Above this
   * threshold we leave the user alone (their context is preserved).
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
  const effBottom = effectiveViewportBottom();
  const topOffscreen = rect.top < offset;
  const bottomOffscreen = rect.bottom > effBottom - threshold;

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
  // Slightly looser threshold for the next-action button: it's sticky above
  // the tabbar and we don't want to chase it with extra scrolls.
  ensureInView(el, { threshold: 48 });
}
