import { Button } from "@/modules/shadcn/ui/button";

export type EmptyTestCasesStateProps = {
  onAddTestCase: () => void;
};

/** Decorative faded table illustration for the empty state. */
function TableIllustration() {
  const barClass = "h-1.5 rounded-lg bg-gray-300";
  const rowClass = "h-7 w-[332px] rounded-lg bg-gray-100";

  return (
    <div className="relative h-40 w-89 overflow-clip">
      {/* Card background */}
      <div className="absolute left-0 top-8 h-32 w-89 rounded-2xl bg-white" />

      {/* Table rows */}
      <div className="absolute left-3 top-16.5">
        {<div className={rowClass} />}
      </div>
      <div className="absolute left-3 top-30.5">
        {<div className={rowClass} />}
      </div>

      {/* Column 1 bars */}
      <div className="absolute left-7.25 top-12.5 flex w-27 flex-col gap-5.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={barClass} />
        ))}
      </div>

      {/* Column 2 bars */}
      <div className="absolute left-44.5 top-12.5 flex w-12 flex-col gap-5.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={barClass} />
        ))}
      </div>

      {/* Column 3 bars */}
      <div className="absolute left-66.5 top-12.5 flex w-16 flex-col gap-5.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={barClass} />
        ))}
      </div>

      {/* Fade-out gradient overlay */}
      <div className="absolute bottom-0 left-0 h-29.75 w-89 bg-linear-to-t from-[#f7f7f7] from-15% to-transparent" />
    </div>
  );
}

export const EmptyTestCasesState = ({
  onAddTestCase,
}: EmptyTestCasesStateProps) => {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 py-24">
      <TableIllustration />

      <div className="flex flex-col items-center gap-2">
        <h3 className="text-[32px] font-medium leading-10 tracking-tight text-foreground/90">
          Start by adding first test case
        </h3>
        <p className="max-w-200 text-center text-base leading-6 text-foreground/60">
          A Test case is a set of parameters based on which the success of the
          measurement will be evaluated. For example, &quot;Vegetables&quot;.
          Within the Vegetables Test case, you can include a group of
          &quot;cucumber&quot; and &quot;pepper&quot;. Both can be tracked for
          position or presence and quantity of items.
        </p>
      </div>

      <Button size="lg" onClick={onAddTestCase}>
        Add use-case
      </Button>
    </div>
  );
};
