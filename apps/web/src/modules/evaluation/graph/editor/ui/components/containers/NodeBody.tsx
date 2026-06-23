import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { ReactNode } from "react";

type Props = {
  controlsHeight: number;
  children: ReactNode;
};

export const NodeBody = ({ controlsHeight, children }: Props) => (
  <div
    className="flex flex-col justify-center px-2 gap-2"
    style={{ height: `${controlsHeight * GRID}px` }}
  >
    {children}
  </div>
);
