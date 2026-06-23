import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const Label = (props: Props) => {
  const { children } = props;

  return (
    <span className="text-base text-zinc-500 font-semibold">{children}</span>
  );
};
