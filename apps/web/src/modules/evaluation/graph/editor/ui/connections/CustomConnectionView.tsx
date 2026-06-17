import { type ClassicScheme, Presets } from "rete-react-plugin";
import styled from "styled-components";

const { useConnection } = Presets.classic;

// FIX(consistency): this file styles the identical svg/path connection markup with styled-components while sibling ToggleConnectionView.tsx uses Tailwind utility classes for the same styles (same 9999px canvas, stroke, dasharray, animation) — fix: pick one approach (Tailwind, to match the rest of src/editor/ui) and share the path styling between the two views; why: the duplicated styles in two styling systems will drift (ToggleConnectionView already adds an animation-delay this one lacks) and doubles maintenance for any stroke/animation tweak.
const Svg = styled.svg`
  overflow: visible !important;
  position: absolute;
  pointer-events: none;
  width: 9999px;
  height: 9999px;
`;

// FIX(structure): the `@keyframes dash` declared inside this styled-component is emitted globally (unhashed) and is the ONLY definition of `dash` in the app, yet ToggleConnectionView's Tailwind class [animation:dash_1s_linear_infinite] silently depends on it — fix: move the dash keyframes into the global stylesheet (or Tailwind theme) instead of a component-scoped style block; why: the keyframes are only injected once a CustomConnectionView has mounted, so toggle connections on a canvas with no plain connection get no animation (hidden load-order coupling).
const Path = styled.path`
  fill: none;
  stroke-width: 5px;
  stroke: var(--color-zinc-400);
  pointer-events: auto;
  stroke-dasharray: 10 5;
  animation: dash 1s linear infinite;
  stroke-dashoffset: 45;
  @keyframes dash {
    to {
      stroke-dashoffset: 0;
    }
  }
`;

// FIX(config): `npm run lint` fails on this line at HEAD — the `_` prefix signals an intentionally-unused param but the eslint config has no `argsIgnorePattern` — fix: add `'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]` to eslint.config.js (or drop the param; rete's customize API doesn't require declaring it); why: a red lint baseline trains everyone to ignore lint failures.
export function CustomConnectionView(_props: {
  data: ClassicScheme["Connection"];
}) {
  const { path } = useConnection();
  if (!path) return null;
  return (
    <Svg data-testid="connection">
      <Path d={path} />
    </Svg>
  );
}
