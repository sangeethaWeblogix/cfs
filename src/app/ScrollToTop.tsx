// app/ScrollToTop.tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    // use 'auto' or 'smooth' if you want an animation
    window.scrollTo(0, 0,);
  }, [pathname]);
  return null;
}
