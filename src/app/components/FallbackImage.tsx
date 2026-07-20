"use client";
import Image from "next/image";
import { useState } from "react";

export default function FallbackImage({ src, fallback = "/images/img.png", ...props }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(fallback)}
      unoptimized
      alt={props.alt || "image"}
    />
  );
}
