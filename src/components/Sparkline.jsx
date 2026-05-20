// Tiny SVG sparkline. Renders a smoothed line + soft area fill below it.
// Empty data → faint dashed midline placeholder so layouts don't jump.
//
// Width/height props feed the viewBox coordinate space; the rendered SVG
// itself fills 100% of its parent (with `responsive` true, default) so it
// scales to any container without distorting. Pass responsive={false} to
// pin to literal pixel dimensions instead.
export function Sparkline({
  data = [],
  color = "currentColor",
  width = 110,
  height = 32,
  fill = true,
  strokeWidth = 1.6,
  responsive = true,
}) {
  const svgProps = responsive
    ? {
        viewBox: `0 0 ${width} ${height}`,
        preserveAspectRatio: "none",
        style: { width: "100%", height, display: "block", overflow: "visible" },
      }
    : { width, height, viewBox: `0 0 ${width} ${height}`, style: { overflow: "visible" } };

  if (!data.length) {
    return (
      <svg {...svgProps}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y];
  });

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  // Random id keeps gradient defs unique per instance.
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg {...svgProps}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      {/* vectorEffect keeps the line a constant pixel width even when the
          SVG is stretched non-uniformly by preserveAspectRatio="none". */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* One round dot per data point so each day reads as a distinct point.
          Drawn as zero-length round-capped paths with non-scaling-stroke so
          they stay perfectly circular even when the SVG is stretched
          horizontally by preserveAspectRatio="none" — a plain <circle> gets
          squashed into a wide ellipse on big screens. */}
      {pts.map(([x, y], i) => (
        <path
          key={i}
          d={`M${x.toFixed(1)},${y.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`}
          stroke={color}
          strokeWidth={i === pts.length - 1 ? strokeWidth * 3.6 : strokeWidth * 2.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      ))}
    </svg>
  );
}
