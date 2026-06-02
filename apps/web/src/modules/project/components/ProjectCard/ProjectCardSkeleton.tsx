import { Skeleton } from "@/modules/shadcn/ui/skeleton";

export const ProjectCardSkeleton = () => {
  return (
    <div className="flex w-[21rem] flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-2/3" />
          <div className="flex flex-row gap-2">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="size-5 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="h-px w-full bg-gray-300" />
      <div className="flex items-center justify-between px-5 py-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};
