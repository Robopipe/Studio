import { LabelEntry } from "./types";

export interface BoxShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    name: string;
    color: string;
    areaQ3: number;
    area: LabelEntry["area"];
    scale: "linear" | "log";
    domainMin: number;
    domainMax: number;
  };
}

export const BoxShape = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: BoxShapeProps) => {
  if (!payload?.area || height <= 0 || payload.areaQ3 <= 0) return null;

  const { q1, q3, median, whiskerLow, whiskerHigh, outliers } = payload.area;
  const { color, scale, domainMin, domainMax } = payload;

  // Pixel calibration using the bar's known anchors:
  //   bar dataKey = q3  →  y = pixel(q3),  y + height = pixel(domainMin)
  //
  // Linear:  toPixel(v) = y + height - (v / q3) * height
  //                     = y + height * (1 - v / q3)
  //
  // Log:     pixel is linear in log10(v), so:
  //          toPixel(v) = y + height * (log10(q3) - log10(v))
  //                                  / (log10(q3) - log10(domainMin))
  //          Clamp v >= domainMin before log to prevent log(0) = -Infinity.

  const log10 = Math.log10;

  const toPixel = (v: number): number => {
    if (scale === "log") {
      const vSafe = Math.max(v, domainMin);
      const logQ3 = log10(q3);
      const logFloor = log10(domainMin);
      return y + height * (logQ3 - log10(vSafe)) / (logQ3 - logFloor);
    }
    // linear
    return y + height - (v / q3) * height;
  };

  // Skip elements whose data values fall entirely outside the visible range
  const inRange = (v: number) => v >= domainMin && v <= domainMax;

  const pQ3 = y; // toPixel(q3) === y by definition
  const pQ1 = toPixel(q1);
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
      <line
        x1={boxLeft}
        x2={boxRight}
        y1={pMedian}
        y2={pMedian}
        stroke={color}
        strokeWidth={2}
      />
      {/* Upper whisker: stem (Q3 → whiskerHigh) */}
      <line
        x1={mid}
        x2={mid}
        y1={pQ3}
        y2={pWH}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      {/* Upper cap */}
      <line
        x1={mid - capHalf}
        x2={mid + capHalf}
        y1={pWH}
        y2={pWH}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Lower whisker: stem (Q1 → whiskerLow) */}
      <line
        x1={mid}
        x2={mid}
        y1={pQ1}
        y2={pWL}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      {/* Lower cap */}
      <line
        x1={mid - capHalf}
        x2={mid + capHalf}
        y1={pWL}
        y2={pWL}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Outlier dots — skip any that fall outside the visible domain */}
      {outliers.filter(inRange).map((o, i) => (
        <circle key={i} cx={mid} cy={toPixel(o)} r={2.5} fill={color} opacity={0.65} />
      ))}
    </g>
  );
};
