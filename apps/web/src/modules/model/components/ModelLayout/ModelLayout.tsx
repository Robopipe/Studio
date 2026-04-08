import { ReactNode } from "react";
import { ModelList } from "../ModelList/ModelList";

export interface ModelLayoutProps {
  children?: ReactNode;
  className?: string;
}

export const ModelLayout = ({ children, className }: ModelLayoutProps) => {
  return (
    <div
      className={`-m-6 flex flex-row justify-between [height:calc(100vh-3.5rem)] ${className ?? ""}`}
    >
      <ModelList className="flex-[25%]" />
      <div className="flex min-h-0 flex-[75%] flex-col overflow-y-auto">
        <div className="flex min-h-0 w-full flex-1 flex-col p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
