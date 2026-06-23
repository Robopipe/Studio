import { type ClassicScheme, Presets } from "rete-react-plugin";
import { CONNECTION_PATH_CLASS, CONNECTION_SVG_CLASS } from "./connectionStyles";

const { useConnection } = Presets.classic;

export function CustomConnectionView(_props: {
  data: ClassicScheme["Connection"];
}) {
  const { path } = useConnection();
  if (!path) return null;
  return (
    <svg data-testid="connection" className={CONNECTION_SVG_CLASS}>
      <path d={path} className={CONNECTION_PATH_CLASS} />
    </svg>
  );
}
