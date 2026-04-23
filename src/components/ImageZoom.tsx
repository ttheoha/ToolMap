"use client";

import { useState } from "react";

export default function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false);

  if (!src) return <div className="w-16 h-16 bg-garage-700 rounded flex items-center justify-center text-garage-500 text-xs">N/A</div>;

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-16 h-16 object-cover rounded cursor-pointer border border-garage-600 hover:border-accent transition-colors"
        onClick={() => setZoomed(true)}
      />
      {zoomed && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
          onClick={() => setZoomed(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
