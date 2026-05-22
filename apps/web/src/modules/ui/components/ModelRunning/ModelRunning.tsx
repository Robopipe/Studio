import { AiPowerIcon } from "@/components/icons";
import { webRoutes } from "@/config/web/routes";
import { Button } from "@/modules/shadcn/ui/button";
import { Link } from "react-router";

export interface ModelRunningProps {
  projectId: number;
  message?: string;
}

export const ModelRunning = ({ projectId, message }: ModelRunningProps) => {
  const runHref = webRoutes.run.replace(":projectId", String(projectId));

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 [&_svg]:size-8 [&_svg]:text-destructive">
        <AiPowerIcon />
      </div>

      <p className="mb-2 text-xl font-semibold text-black">
        Model is running!
      </p>

      <p className="mb-6 text-sm text-black/60">
        {message ?? "You cannot use capture while a model is running. Disable it first."}
      </p>

      <Link to={runHref}>
        <Button>Go to Run page</Button>
      </Link>
    </div>
  );
};
