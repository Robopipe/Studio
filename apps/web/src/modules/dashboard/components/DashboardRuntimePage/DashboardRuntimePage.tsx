import { LayoutDashboard } from "lucide-react";

export interface DashboardRuntimePageProps {
  configId: number;
  dashboardUrl: string | null;
}

export const DashboardRuntimePage = ({
  dashboardUrl,
}: DashboardRuntimePageProps) => {
  if (dashboardUrl) {
    return (
      <iframe
        src={dashboardUrl}
        className="-m-6 h-[calc(100%+2rem)] w-[calc(100%+3rem)] border-none"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/5 [&_svg]:size-7 [&_svg]:text-black/30">
        <LayoutDashboard />
      </div>
      <p className="mb-2 text-base text-black/85">Dashboard is not running</p>
      <p className="max-w-[360px] text-center text-sm text-black/45">
        Configure your setup and click Deploy in the tab bar to start the
        dashboard.
      </p>
    </div>
  );
};
