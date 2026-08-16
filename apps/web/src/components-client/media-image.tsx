"use client";

import { useState, type ReactNode } from "react";

/**
 * Renders a CMS-supplied photo, falling back to branded placeholder markup
 * whenever the source is missing OR the request fails (404, timeout, CORS,
 * offline). Plain `<img>` tags leave a bare broken-image glyph or raw alt
 * text on screen when a URL goes bad - this keeps the archival, institutional
 * look intact no matter what the network does.
 */
export function MediaImage({
  src,
  alt,
  className,
  fallback,
  loading,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
