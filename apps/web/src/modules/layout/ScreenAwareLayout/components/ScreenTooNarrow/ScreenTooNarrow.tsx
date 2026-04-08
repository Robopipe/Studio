import { Footer, Logo } from "@/modules/ui";
import { Monitor } from "lucide-react";

export const ScreenTooNarrow = () => {
  return (
    <main>
      <div
        className="h-screen w-full px-4 pb-8 pt-16"
        style={{
          background:
            "linear-gradient(180deg, rgba(67, 196, 125, 0.15) 0%, rgba(0, 0, 0, 0) 40%), #0f0f18",
        }}
      >
        <div className="flex h-full flex-col items-center gap-8">
          <Logo />
          <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 [&_svg]:size-8 [&_svg]:text-white/90">
            <Monitor />
          </div>
          <h3 className="text-center text-[2rem] font-medium leading-[1.25em] tracking-[-0.02em] text-white/90">
            Unsupported <br /> screen size
          </h3>
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-3xl text-center text-sm text-white/60">
              We're sorry, but this app isn't currently optimized for your
              device's screen size. For the best experience, please use a device
              with a screen width of at least 1024px.
            </p>
            <p className="max-w-3xl text-center text-sm text-white/60">
              If you still wish to proceed, try switching your browser to
              desktop mode.
            </p>
          </div>
          <Footer variant="light" />
        </div>
      </div>
    </main>
  );
};
