// components/PieChart.jsx
import { useEffect, useRef, useState, memo } from "react";

const DURATION = 900; // ms per slice
const STAGGER = 250; // ms between slices
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;

// Stagger order (covers singular/plural)
const ORDER = {
  Main: 0,
  Mains: 0,
  Side: 1,
  Sides: 1,
  Dessert: 2,
  Desserts: 2,
  Beverage: 3,
  Beverages: 3,
  Misc: 4,
  Miscellaneous: 4,
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

function PieChart({ data }) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const prevTotalRef = useRef(0);

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total <= 0) return null;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const startAnimation = () => {
    if (prefersReduced) {
      setElapsed(Infinity);
      return;
    }
    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();
    const step = (t) => {
      const e = t - startRef.current;
      setElapsed(e);
      const totalRun = DURATION + STAGGER * Math.max(0, data.length - 1);
      if (e < totalRun) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Run once on mount
  useEffect(() => {
    startAnimation();
    prevTotalRef.current = total;
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-animate only when total items INCREASES
  useEffect(() => {
    if (total > prevTotalRef.current) {
      startAnimation();
    }
    prevTotalRef.current = total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, data.length]);

  let cumulative = 0;
  const slices = data.map((item, i) => {
    const frac = item.count / total;
    const fullSweep = frac * 2 * Math.PI;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const staggerIndex = ORDER[item.name] ?? i;
    const raw = prefersReduced
      ? 1
      : clamp01((elapsed - staggerIndex * STAGGER) / DURATION);
    const p = easeOutCubic(raw);

    const endAngle = startAngle + fullSweep * p;

    const x1 = CENTER + RADIUS * Math.cos(startAngle);
    const y1 = CENTER + RADIUS * Math.sin(startAngle);
    const x2 = CENTER + RADIUS * Math.cos(endAngle);
    const y2 = CENTER + RADIUS * Math.sin(endAngle);

    const sweep = fullSweep * p;
    const largeArc = sweep > Math.PI ? 1 : 0;

    cumulative += frac;

    if (p <= 0) return null;

    const d = [
      `M ${CENTER} ${CENTER}`,
      `L ${x1} ${y1}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return (
      <path
        key={item.name} // stable key per category
        d={d}
        fill={item.color}
        stroke="#fff"
        strokeWidth="2"
        style={{
          transformOrigin: `${CENTER}px ${CENTER}px`,
          transform: `scale(${0.95 + 0.05 * p})`,
          opacity: 0.5 + 0.5 * p,
        }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        {slices}
      </svg>
    </div>
  );
}

// Prevent re-render unless the pie *data* actually changes
function areEqual(prev, next) {
  const a = [...prev.data].sort((x, y) => x.name.localeCompare(y.name));
  const b = [...next.data].sort((x, y) => x.name.localeCompare(y.name));
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].name !== b[i].name ||
      a[i].count !== b[i].count ||
      a[i].color !== b[i].color
    ) {
      return false;
    }
  }
  return true; // equal -> skip re-render
}

export default memo(PieChart, areEqual);
