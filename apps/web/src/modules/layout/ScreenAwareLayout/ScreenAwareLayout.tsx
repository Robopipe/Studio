import { PropsWithChildren, useEffect, useState } from "react";
import { ScreenTooNarrow } from "./components";

export interface ScreenAwareLayoutProps extends PropsWithChildren {}

const SCREEN_NARROW_THRESHOLD = 9000;

export const ScreenAwareLayout = ({ children }: PropsWithChildren) => {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < SCREEN_NARROW_THRESHOLD);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isNarrow) {
    return <ScreenTooNarrow />;
  }

  return <main>{children}</main>;
};
