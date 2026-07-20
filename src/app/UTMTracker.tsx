"use client";

import { useEffect } from "react";
import { storeUTM } from "@/utils/seo/utm";

export default function UTMTracker() {
  useEffect(() => {
    storeUTM();
  }, []);

  return null; // nothing to render, just runs effect
}
