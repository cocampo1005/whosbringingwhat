import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Props
 * - data: [{ name, count, color }]
 * - size: number (px)              default 160
 * - animate: boolean               default true
 * - duration: number (ms)          per-slice duration, default 650
 * - delayStep: number (ms)         extra delay per index, default 120
 * - startAngle: number (radians)   default -Math.PI/2 (12 o'clock)
 * - emptyLabel: string             default "No items yet"
 * - strokeWidth: number (px)       stroke width for gaps, default 2
 * - strokeColor: string            stroke color for gaps, default "white"
 */
export default function PieChart({
  data = [],
  size = 160,
  animate = true,
  duration = 650,
  delayStep = 120,
  startAngle = -Math.PI / 2,
  emptyLabel = "No items yet",
  strokeWidth = 2,
  strokeColor = "white",
}) {
  const EPS = 1e-4; // guard for "full circle" sweeps

  // Keep only non-zero slices
  const slices = useMemo(
    () => (data || []).filter((d) => Number(d.count) > 0),
    [data],
  );
  const total = useMemo(
    () => slices.reduce((s, d) => s + Number(d.count), 0),
    [slices],
  );

  const w = size;
  const h = size;
  const cx = w / 2;
  const cy = h / 2;
  const r = size / 2;

  // Empty state
  if (!total) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500"
        style={{ width: w, height: h }}
      >
        {emptyLabel}
      </div>
    );
  }

  // Precompute target arcs (no animation yet)
  const targets = useMemo(() => {
    let angle = startAngle;
    return slices.map((d, idx) => {
      const sweep = (d.count / total) * Math.PI * 2;
      const start = angle;
      let end = angle + sweep;
      // Ensure last slice closes the circle precisely
      if (idx === slices.length - 1) end = startAngle + Math.PI * 2;
      angle = end;
      return { d, start, end };
    });
  }, [slices, total, startAngle]);

  // Staggered progress per slice (0..1)
  const [progress, setProgress] = useState(() =>
    targets.map(() => (animate ? 0 : 1)),
  );
  const rafRef = useRef(null);

  useEffect(() => {
    if (!animate) {
      setProgress(targets.map(() => 1));
      return;
    }

    let mounted = true;
    const starts = targets.map((_, i) => performance.now() + i * delayStep);
    const ends = starts.map((s) => s + duration);

    const easeOutCubic = (t) =>
      1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

    const frame = (now) => {
      if (!mounted) return;
      const next = progress.slice();
      let done = true;

      for (let i = 0; i < targets.length; i++) {
        if (now <= starts[i]) {
          next[i] = 0;
          done = false;
        } else if (now >= ends[i]) {
          next[i] = 1;
        } else {
          const t = (now - starts[i]) / (ends[i] - starts[i]);
          next[i] = easeOutCubic(t);
          done = false;
        }
      }

      setProgress(next);
      if (!done) rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mounted = false;
    };
  }, [targets.length, duration, delayStep, animate]);

  // Helpers
  const polar = (radius, angleRad) => ({
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  });

  // Single-slice optimized path (grows to full circle)
  if (targets.length === 1) {
    const only = targets[0];
    const pct = progress[0] ?? 1;
    const sweepFull = only.end - only.start; // should be ~2π
    const sweepNow = sweepFull * pct;

    // If we're at or effectively at a full circle, draw a circle element
    if (sweepNow >= 2 * Math.PI - EPS) {
      return (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Item distribution"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={only.d.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    const end = only.start + sweepNow;
    const p0 = polar(r, only.start);
    const p1 = polar(r, end);
    const largeArc = sweepNow > Math.PI ? 1 : 0;

    const dPath = [
      `M ${cx} ${cy}`,
      `L ${p0.x} ${p0.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ");

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Item distribution"
      >
        <path
          d={dPath}
          fill={only.d.color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // Build animated sectors for all slices
  const paths = targets.map((t, idx) => {
    const pct = progress[idx] ?? 1;
    const sweepFull = t.end - t.start;
    const sweepNow = sweepFull * pct;

    // Small guard: if a slice were ever to hit full circle due to rounding,
    // render a circle for stability (won't really happen with >1 slice).
    if (sweepNow >= 2 * Math.PI - EPS) {
      return {
        key: t.d.name,
        color: t.d.color,
        circle: true,
      };
    }

    const end = t.start + sweepNow;
    const p0 = polar(r, t.start);
    const p1 = polar(r, end);
    const largeArc = sweepNow > Math.PI ? 1 : 0;

    const dPath = [
      `M ${cx} ${cy}`,
      `L ${p0.x} ${p0.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ");

    return { key: t.d.name, color: t.d.color, dPath };
  });

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Item distribution"
    >
      <title>Item distribution</title>
      {paths.map((seg) =>
        seg.circle ? (
          <circle
            key={seg.key}
            cx={cx}
            cy={cy}
            r={r}
            fill={seg.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        ) : (
          <path
            key={seg.key}
            d={seg.dPath}
            fill={seg.color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        ),
      )}
    </svg>
  );
}
