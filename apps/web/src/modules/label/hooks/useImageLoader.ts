import { useEffect, useState } from "react";

export const useImageLoader = (url: string | undefined) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) {
        setImage(img);
        setLoading(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setError("Failed to load image");
        setLoading(false);
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { image, loading, error };
};
