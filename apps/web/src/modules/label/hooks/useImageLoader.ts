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

    setLoading(true);
    setError(null);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Failed to load image");
      setLoading(false);
    };
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return { image, loading, error };
};
