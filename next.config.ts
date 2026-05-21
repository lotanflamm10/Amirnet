import type { NextConfig } from "next";
import path from "node:path";

/**
 * Pin the Turbopack workspace root to THIS project directory.
 *
 * Without this, Next.js 16 / Turbopack walks up from CWD looking for a
 * package.json or lockfile and can land on the parent folder (c:\Lotan)
 * when sibling artifacts (e.g. amirnet.zip, Bugs/) sit next to the
 * project. Once it picks the wrong root it searches that root's
 * non-existent node_modules and throws:
 *   "Can't resolve 'tailwindcss' in 'c:\Lotan'"
 *
 * Pinning the root explicitly is the official Next 16 fix.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Optional: silence the harmless "middleware → proxy" rename warning
  // by keeping the deprecated file name working. (Non-blocking either way.)
};

export default nextConfig;
