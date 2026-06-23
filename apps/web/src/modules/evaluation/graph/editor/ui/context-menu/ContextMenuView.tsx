import { Presets } from "rete-react-plugin";
import styled, { css } from "styled-components";

export const Menu = styled(Presets.contextMenu.Menu)`
  background: var(--color-zinc-50);
  color: var(--color-zinc-400);
  border: 1px solid var(--color-zinc-200);
  border-radius: 0.5rem;
  padding: 0.25rem;
`;

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
