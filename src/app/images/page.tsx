 "use client";

 import { useEffect, useState } from "react";

interface BlobFile {
  url: string;
  pathname: string;
  size?: number;
  uploadedAt?: string;
}

export default function BlobImageList() {
  const [images, setImages] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      try {
        // ✅ Use relative path (no hardcoded domain)
        const res = await fetch("/api/avatar/list");
        if (!res.ok) throw new Error("Failed to fetch images");

        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error("Error fetching blob list:", err);
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, []);

  if (loading) {
    return <p className="text-gray-500 text-center">Loading images...</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {images.length === 0 ? (
        <p className="text-gray-400 col-span-full text-center">
          No images found
        </p>
      ) : (
        images.map((img) => (
          <div key={img.pathname} className="flex flex-col items-center">
            <img
              src={img.url}
              alt={img.pathname}
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <p className="text-xs text-gray-500 mt-1 truncate w-32">
              {img.pathname}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
