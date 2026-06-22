// Sparkline.tsx — Tiny inline SVG chart for KPI cards.
// Takes an array of numbers and draws a smooth trend line.
// No external library needed — pure SVG.

type SparklineProps = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  data,
  color = "#C0162C",
  width = 80,
  height = 32,
}: SparklineProps) {
  // Need at least 2 points to draw a line
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  // Avoid division by zero if all values are the same
  const range = max - min || 1;

  // Map each data point to SVG (x, y) coordinates
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    // Invert Y because SVG Y=0 is at the top
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="opacity-80"
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
