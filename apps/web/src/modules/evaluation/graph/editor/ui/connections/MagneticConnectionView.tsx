import { useEffect, useState } from "react";
import { type ClassicScheme, Presets } from "rete-react-plugin";
import {
  CONNECTION_SVG_CLASS,
  MAGNETIC_CONNECTION_PATH_CLASS,
} from "./connectionStyles";

const { useConnection } = Presets.classic;

const VISIBLE_OPACITY = 0.4;

export function MagneticConnectionView(_props: {
  data: ClassicScheme["Connection"];
}) {
  const { path } = useConnection();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!path) return null;

  return (
    <svg
      data-testid="magnetic-connection"
      className={CONNECTION_SVG_CLASS}
      style={{
        opacity: shown ? VISIBLE_OPACITY : 0,
        transition: "opacity 150ms ease-out",
      }}
    >
      <path d={path} className={MAGNETIC_CONNECTION_PATH_CLASS} />
    </svg>
  );
}
