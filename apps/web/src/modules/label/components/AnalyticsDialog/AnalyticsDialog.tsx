import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/modules/shadcn/ui/tabs";
import { useGetDatasetStatsQuery } from "@/modules/analytics/services/analyticsApi";
import { cn } from "@/lib/utils";
import { AnalyticsDatasetStats, AnnotationType } from "@repo/schema";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_TYPES: AnnotationType[] = ["rectangle", "polygon", "classification"];

const MAX_TICK_CHARS = 14;
const truncateTick = (value: string) =>
  value.length > MAX_TICK_CHARS ? value.slice(0, MAX_TICK_CHARS) + "…" : value;

interface CategoryTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

const CategoryTick = ({ x = 0, y = 0, payload }: CategoryTickProps) => {
  const full = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        transform="rotate(-45)"
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fontSize={11}
        fill="#666"
      >
        <title>{full}</title>
        {truncateTick(full)}
      </text>
    </g>
  );
};

const TYPE_LABELS: Record<AnnotationType, string> = {
  rectangle: "Bounding boxes",
  polygon: "Polygons",
  classification: "Classifications",
};

export const AnalyticsDialog = ({
  open,
  onOpenChange,
}: AnalyticsDialogProps) => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  // null = not yet initialized; set to available types on first data load
  const [selectedTypes, setSelectedTypes] = useState<AnnotationType[] | null>(null);

  const requestTypes = selectedTypes ?? ALL_TYPES;
  const typesParam = requestTypes.join(",");

  const { data, isLoading, isError } = useGetDatasetStatsQuery(
    { projectId: projectId!, types: typesParam },
    { skip: !projectId || !open },
  );

  // Default selection: only the annotation types that actually have data
  useEffect(() => {
    if (data?.availableTypes && selectedTypes === null) {
      const initial = ALL_TYPES.filter((t) => data.availableTypes[t]);
      setSelectedTypes(initial.length > 0 ? initial : ALL_TYPES);
    }
  }, [data?.availableTypes, selectedTypes]);

  const toggleType = (type: AnnotationType) => {
    setSelectedTypes((prev) => {
      const current = prev ?? ALL_TYPES;
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return next.length > 0 ? next : current;
    });
  };

  const hasGeometricType =
    requestTypes.includes("rectangle") || requestTypes.includes("polygon");

  const hasAnyAreaData = data?.labels.some((l) => l.area !== null) ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-215">
        <DialogHeader>
          <DialogTitle>Dataset Analytics</DialogTitle>
        </DialogHeader>

        {/* Annotation type selector */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {ALL_TYPES.map((type) => {
            const available = data?.availableTypes[type] ?? true;
            const selected = requestTypes.includes(type);
            const isLastSelected = selected && requestTypes.length === 1;
            return (
              <button
                key={type}
                type="button"
                disabled={!available || isLastSelected}
                onClick={() => toggleType(type)}
                title={!available ? "No annotations of this type in this project" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  selected && available
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-black/10 bg-transparent text-muted-foreground opacity-50",
                  (!available || isLastSelected) && "cursor-not-allowed",
                )}
              >
                {TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>

        {/* Charts */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {isError && (
            <div className="flex h-64 items-center justify-center text-sm text-red-500">
              Failed to load analytics. Please try again.
            </div>
          )}
          {data && !isLoading && !isError && (
            <Tabs defaultValue="instances">
              <TabsList variant="line" className="shrink-0">
                <TabsTrigger value="instances">Instances</TabsTrigger>
                <TabsTrigger value="sizes">Sizes</TabsTrigger>
              </TabsList>

              <TabsContent value="instances" className="pt-4">
                {data.labels.length === 0 ? (
                  <EmptyState message="No labels found for this project." />
                ) : (
                  <InstancesChart labels={data.labels} />
                )}
              </TabsContent>

              <TabsContent value="sizes" className="pt-4">
                {!hasGeometricType ? (
                  <EmptyState message="Select bounding boxes or polygons to see size data." />
                ) : !hasAnyAreaData ? (
                  <EmptyState message="No geometric annotations found for the selected types." />
                ) : (
                  <SizesChart labels={data.labels} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Instances chart — vertical bar chart per label
// ---------------------------------------------------------------------------

type LabelEntry = AnalyticsDatasetStats["labels"][number];

const InstancesChart = ({ labels }: { labels: LabelEntry[] }) => {
  // Attach color directly onto the datum so recharts can read it per-bar
  const chartData = labels.map((l) => ({
    name: l.name,
    count: l.instanceCount,
    fill: l.color,
  }));

  const barWidth = Math.max(chartData.length * 60, 400);

  return (
    <div className="overflow-x-auto pb-2">
      <ResponsiveContainer width={barWidth} height={280} minWidth={barWidth}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="name"
            tick={<CategoryTick />}
            interval={0}
            height={80}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            width={45}
            label={{
              value: "Instances",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 11 },
            }}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value.toLocaleString() : String(value),
              "Instances",
            ]}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar
            dataKey="count"
            isAnimationActive={false}
            shape={(props: unknown) => {
              const { x, y, width, height, payload } = props as {
                x: number; y: number; width: number; height: number;
                payload: { fill: string };
              };
              if (height <= 0) return null;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={payload.fill}
                  rx={3}
                  ry={3}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sizes chart — custom box-and-whisker (Tukey) per label
// ---------------------------------------------------------------------------

const SizesChart = ({ labels }: { labels: LabelEntry[] }) => {
  const labelsWithArea = labels.filter((l) => l.area !== null);

  if (labelsWithArea.length === 0) {
    return <EmptyState message="No size data for the selected types." />;
  }

  // Use q3 as the recharts dataKey; custom BoxShape draws the full box plot
  const chartData = labelsWithArea.map((l) => ({
    name: l.name,
    color: l.color,
    areaQ3: l.area!.q3,
    area: l.area,
  }));

  // Extend Y axis to cover the highest whiskerHigh value with a 15% margin
  const maxWhisker = Math.max(...labelsWithArea.map((l) => l.area!.whiskerHigh));
  const yMax = maxWhisker > 0 ? maxWhisker * 1.15 : 0.1;

  const barWidth = Math.max(chartData.length * 80, 400);

  return (
    <div className="overflow-x-auto pb-2">
      <p className="mb-3 text-xs text-muted-foreground">
        Area as % of image — box: Q1–Q3, line: median, whiskers: 1.5 × IQR
        {labelsWithArea.some((l) => (l.area?.outlierCount ?? 0) > 0) && ", dots: outliers"}
      </p>
      <ResponsiveContainer width={barWidth} height={300} minWidth={barWidth}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="name"
            tick={<CategoryTick />}
            interval={0}
            height={80}
          />
          <YAxis
            domain={[0, yMax]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            tick={{ fontSize: 11 }}
            width={55}
            label={{
              value: "Area % of image",
              angle: -90,
              position: "insideLeft",
              offset: 15,
              style: { fontSize: 11 },
            }}
          />
          <Tooltip content={<BoxPlotTooltip />} cursor={false} />
          <Bar
            dataKey="areaQ3"
            isAnimationActive={false}
            shape={(props: unknown) => <BoxShape {...(props as BoxShapeProps)} />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Custom box plot bar shape
// ---------------------------------------------------------------------------

interface BoxShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    name: string;
    color: string;
    areaQ3: number;
    area: LabelEntry["area"];
  };
}

const BoxShape = ({ x = 0, y = 0, width = 0, height = 0, payload }: BoxShapeProps) => {
  if (!payload?.area || height <= 0 || payload.areaQ3 <= 0) return null;

  const { q1, q3, median, whiskerLow, whiskerHigh, outliers } = payload.area;
  const color = payload.color;

  // Pixel calibration using the bar itself:
  //   bar dataKey = q3  →  y = pixel of q3,  height = pixel distance (q3 → 0)
  //   pixelsPerUnit = height / q3  (linear axis starting at 0)
  //   pixelOf(v) = y + height - v * pixelsPerUnit
  const ppu = height / q3;
  const toPixel = (v: number) => y + height - v * ppu;

  const pQ1 = toPixel(q1);
  const pQ3 = y; // toPixel(q3) === y by definition
  const pMedian = toPixel(median);
  const pWL = toPixel(whiskerLow);
  const pWH = toPixel(whiskerHigh);

  const pad = width * 0.15;
  const boxLeft = x + pad;
  const boxRight = x + width - pad;
  const mid = x + width / 2;
  const capHalf = (boxRight - boxLeft) * 0.3;

  return (
    <g>
      {/* IQR box Q1 → Q3 */}
      <rect
        x={boxLeft}
        y={pQ3}
        width={boxRight - boxLeft}
        height={Math.max(pQ1 - pQ3, 1)}
        fill={`color-mix(in oklab, ${color}, transparent 65%)`}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Median line */}
      <line x1={boxLeft} x2={boxRight} y1={pMedian} y2={pMedian} stroke={color} strokeWidth={2} />
      {/* Upper whisker: stem (Q3 → whiskerHigh) */}
      <line x1={mid} x2={mid} y1={pQ3} y2={pWH} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Upper cap */}
      <line x1={mid - capHalf} x2={mid + capHalf} y1={pWH} y2={pWH} stroke={color} strokeWidth={1.5} />
      {/* Lower whisker: stem (Q1 → whiskerLow) */}
      <line x1={mid} x2={mid} y1={pQ1} y2={pWL} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      {/* Lower cap */}
      <line x1={mid - capHalf} x2={mid + capHalf} y1={pWL} y2={pWL} stroke={color} strokeWidth={1.5} />
      {/* Outlier dots */}
      {outliers.map((o, i) => (
        <circle key={i} cx={mid} cy={toPixel(o)} r={2.5} fill={color} opacity={0.65} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Custom tooltip for box plot
// ---------------------------------------------------------------------------

interface BoxPlotTooltipProps {
  active?: boolean;
  payload?: {
    payload: { name: string; color: string; area: LabelEntry["area"] };
  }[];
}

const BoxPlotTooltip = ({ active, payload }: BoxPlotTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, color, area } = payload[0].payload;
  if (!area) return null;

  const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <div className="rounded-lg border border-black/10 bg-background p-3 text-xs shadow-md">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: color }} />
        {name}
      </div>
      <table className="w-full border-separate border-spacing-x-3">
        <tbody>
          {(
            [
              ["Max", area.max],
              ["Whisker high", area.whiskerHigh],
              ["Q3", area.q3],
              ["Median", area.median],
              ["Q1", area.q1],
              ["Whisker low", area.whiskerLow],
              ["Min", area.min],
            ] as [string, number][]
          ).map(([label, value]) => (
            <tr key={label}>
              <td className="text-muted-foreground">{label}</td>
              <td className="text-right font-mono">{fmt(value)}</td>
            </tr>
          ))}
          {area.outlierCount > 0 && (
            <tr>
              <td className="text-muted-foreground">Outliers</td>
              <td className="text-right font-mono">{area.outlierCount}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty state helper
// ---------------------------------------------------------------------------

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-black/10 text-sm text-muted-foreground">
    {message}
  </div>
);
