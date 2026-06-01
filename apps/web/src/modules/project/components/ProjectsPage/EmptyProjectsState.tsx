import { Button } from "@/modules/shadcn/ui/button";

export type EmptyProjectsStateProps = {
  onCreate: () => void;
};

function FauxCard() {
  return (
    <div className="w-28 rounded-xl bg-white">
      <div className="flex flex-col gap-2 p-3">
        <div className="h-2 w-14 rounded bg-gray-300" />
        <div className="h-1.5 w-10 rounded bg-gray-200" />
      </div>
      <div className="h-px bg-gray-200" />
      <div className="flex items-center justify-between p-3">
        <div className="h-1.5 w-12 rounded bg-gray-200" />
        <div className="size-5 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

function CardGridIllustration() {
  return (
    <div className="relative h-40 w-90 overflow-clip">
      <div className="absolute left-0 top-4 flex gap-3">
        {[0, 1, 2].map((i) => (
          <FauxCard key={i} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 h-28 w-90 bg-linear-to-t from-gray-50 from-15% to-transparent" />
    </div>
  );
}

export const EmptyProjectsState = ({ onCreate }: EmptyProjectsStateProps) => {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-24">
      <CardGridIllustration />

      <div className="flex flex-col items-center gap-2">
        <h3 className="text-[32px] font-medium leading-10 tracking-tight text-foreground/90">
          Start by creating your first project
        </h3>
        <p className="max-w-200 text-center text-base leading-6 text-foreground/60">
          A project organizes your captured images, labels, and trained models.
          Create one to begin the Capture &rarr; Label &rarr; Train &rarr; Infer
          workflow.
        </p>
      </div>

      <Button size="lg" onClick={onCreate}>
        New project
      </Button>
    </div>
  );
};
