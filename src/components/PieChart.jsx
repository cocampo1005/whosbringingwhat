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
 * - variant: "pie" | "donut"       default "pie" (donut = thick rounded arcs with the total in the centre)
 * - centerLabel: string            donut only, word under the total, default "ITEMS"
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
  variant = "pie",
  centerLabel = "ITEMS",
}) {
  const EPS = 1e-4; // guard for "full circle" sweeps
  const isDonut = variant === "donut";

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

  // Donut geometry: a thick ring whose rounded caps stay inside the box.
  const ringWidth = Math.round(size * 0.2);
  const ringRadius = size / 2 - ringWidth / 2 - 2;
  // Angular gap between arcs: the round caps eat ringWidth / 2 on each side.
  const gapAngle = (ringWidth + 6) / ringRadius;

  // Precompute target arcs (no animation yet)
  const targets = useMemo(() => {
    let angle = startAngle;
    return slices.map((d, idx) => {
      const sweep = total ? (d.count / total) * Math.PI * 2 : 0;
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
      const next = [];
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

  // Empty state
  if (!total) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-surface2 text-xs text-muted"
        style={{ width: w, height: h }}
      >
        {emptyLabel}
      </div>
    );
  }

  // Helpers
  const polar = (radius, angleRad, cX = cx, cY = cy) => ({
    x: cX + radius * Math.cos(angleRad),
    y: cY + radius * Math.sin(angleRad),
  });

  // ---- Donut variant -------------------------------------------------------
  if (isDonut) {
    const single = targets.length === 1;
    // Fewer/narrower gaps with many slices, and a minimum visible sweep for every
    // non-zero slice; the extra is taken from the larger slices so the total stays 2π.
    const gap = single ? 0 : targets.length >= 5 ? gapAngle / 2 : gapAngle;
    const MIN_SWEEP = 0.18;
    const baseSweeps = targets.map((t) => Math.max(t.end - t.start - gap, 0.001));
    const deficit = baseSweeps.reduce(
      (sum, u) => sum + Math.max(MIN_SWEEP - u, 0),
      0,
    );
    const surplus = baseSweeps.reduce(
      (sum, u) => sum + Math.max(u - MIN_SWEEP, 0),
      0,
    );
    const take = Math.min(deficit, surplus);
    const sweeps = baseSweeps.map((u) =>
      u < MIN_SWEEP && deficit > 0
        ? u + ((MIN_SWEEP - u) / deficit) * take
        : u > MIN_SWEEP && surplus > 0
          ? u - ((u - MIN_SWEEP) / surplus) * take
          : u,
    );
    let cursor = targets.length ? targets[0].start : 0;
    const arcs = targets.map((t, idx) => {
      const pct = progress[idx] ?? 1;
      const usable = sweeps[idx];
      const sweepNow = usable * pct;
      const a0 = cursor + gap / 2;
      cursor += usable + gap;

      if (single && sweepNow >= 2 * Math.PI - EPS) {
        return { key: t.d.name, color: t.d.color, circle: true };
      }

      const a1 = a0 + Math.max(sweepNow, 0.001);
      const p0 = polar(ringRadius, a0);
      const p1 = polar(ringRadius, a1);
      const largeArc = a1 - a0 > Math.PI ? 1 : 0;
      return {
        key: t.d.name,
        color: t.d.color,
        dPath: `M ${p0.x} ${p0.y} A ${ringRadius} ${ringRadius} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
      };
    });

    return (
      <div className="relative" style={{ width: w, height: h }}>
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Item distribution"
        >
          <title>Item distribution</title>
          {arcs.map((seg) =>
            seg.circle ? (
              <circle
                key={seg.key}
                cx={cx}
                cy={cy}
                r={ringRadius}
                fill="none"
                stroke={seg.color}
                strokeWidth={ringWidth}
              />
            ) : (
              <path
                key={seg.key}
                d={seg.dPath}
                fill="none"
                stroke={seg.color}
                strokeWidth={ringWidth}
                strokeLinecap="round"
              />
            ),
          )}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-ink"
          aria-hidden="true"
        >
          <span
            className="font-display font-extrabold leading-none [font-stretch:125%]"
            style={{ fontSize: Math.round(size * 0.27) }}
          >
            {total}
          </span>
          {centerLabel && (
            <span
              className="mt-1 font-display font-bold uppercase leading-none tracking-wider"
              style={{ fontSize: Math.max(10, Math.round(size * 0.065)) }}
            >
              {centerLabel}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ---- Classic pie variant (unchanged geometry) ---------------------------

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
