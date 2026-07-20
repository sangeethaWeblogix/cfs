import type { ReactNode } from "react";
import type { Metadata } from "next";

// Suppress generic /listings/ metadata inherited from parent layout.
// Root layout <head> JSX provides per-slug title/canonical/description/robots directly.
export const metadata: Metadata = {
  // title intentionally omitted — handled by generateMetadata in page.tsx
  description: null,
  alternates: null,
  robots: null,
  openGraph: null,
  twitter: null,
};

export default function SlugLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
