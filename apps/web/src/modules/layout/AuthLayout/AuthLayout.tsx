import { KoalaLogo, Logo } from "@/modules/ui";
import { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { ScreenAwareLayout } from "../ScreenAwareLayout";
import { AuthBackground } from "./AuthBackground";

export interface AuthLayoutProps {
  children?: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const content = children ? children : <Outlet />;

  return (
    <ScreenAwareLayout>
      <div className="flex h-screen flex-row overflow-hidden">
        <div
          className="relative w-full flex-[0_0_65%] overflow-hidden p-16"
          style={{
            background:
              "linear-gradient(180deg, rgba(67, 196, 125, 0.15) 0%, rgba(0, 0, 0, 0) 40%), #0f0f18",
          }}
        >
          <AuthBackground className="absolute -right-16 top-8 z-0 h-full w-full" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Logo />
            <div>
              <h2 className="text-[2.75rem] font-medium leading-[1.25em] tracking-[-0.06em] text-emerald-100">
                Open-Source Solution for Industrial
              </h2>
              <h2 className="text-[2.75rem] font-medium leading-[1.25em] tracking-[-0.06em] text-emerald-400">
                Machine Vision
              </h2>
              <div className="mt-8 flex flex-row items-center gap-3">
                <span className="text-emerald-100">by</span>
                <Link
                  to="https://koala42.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <KoalaLogo />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex-[0_0_35%]">{content}</div>
      </div>
    </ScreenAwareLayout>
  );
};
