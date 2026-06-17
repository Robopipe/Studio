// FIX(structure): lone .ts file in ui/ root exporting React (styled) components, while every sibling view is a .tsx inside a subfolder (connections/, controls/, nodes/, sockets/) — fix: rename to .tsx and move to e.g. src/editor/ui/context-menu/ContextMenuView.tsx; why: the inconsistent extension/placement hides the React-component nature from tooling and humans.
import { Presets } from "rete-react-plugin";
import styled, { css } from "styled-components";

export const Menu = styled(Presets.contextMenu.Menu)`
  background: var(--color-zinc-50);
  color: var(--color-zinc-400);
  border: 1px solid var(--color-zinc-200);
  border-radius: 0.5rem;
  padding: 0.25rem;
`;

// FIX(dead-code): the &:hover rule sets `border-color` but the base style declares `border: none`, so the hover border-color can never render — fix: drop the `border-color` line from the hover block (or add a transparent base border if a hover border is intended); why: dead declarations mislead readers into thinking a hover border exists.
export const Item = styled(Presets.contextMenu.Item).withConfig({
  shouldForwardProp: (prop) => prop !== "hasSubitems",
})<{ hasSubitems?: boolean }>`
  background: transparent;
  color: var(--color-zinc-400);
  border: none;
  border-radius: 0.375rem;
  position: relative;

  &:hover {
    background: var(--color-zinc-100);
    border-color: var(--color-zinc-200);
    border-radius: 0.375rem;
  }

  ${(props) =>
    props.hasSubitems &&
    css`
      &:after {
        content: "►";
        position: absolute;
        opacity: 0.6;
        right: 5px;
        top: 5px;
      }
    `}
`;

export const Common = styled(Presets.contextMenu.Common)`
  background: transparent;
  color: var(--color-zinc-400);
  border: none;
  border-radius: 0.375rem;

  &:hover {
    background: var(--color-zinc-200);
    color: var(--color-zinc-500);
    border-radius: 0.375rem;
  }
`;

export const Search = styled(Presets.contextMenu.Search)`
  display: none;
`;

export const Subitems = styled(Presets.contextMenu.Subitems)`
  background: var(--color-zinc-50);
  color: var(--color-zinc-400);
  border: 1px solid var(--color-zinc-200);
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
`;
