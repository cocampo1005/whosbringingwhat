/** Props: tabs [{ value, label }], value, onChange(value), ariaLabel, variant ("segmented" | "chips"), className. */
export default function SegmentedTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  variant = "segmented",
  className = "",
}) {
  const chips = variant === "chips";
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`${
        chips ? "inline-flex gap-2" : "inline-flex gap-1 rounded-full bg-raised p-1 shadow-soft"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(tab.value)}
            className={`rounded-full px-4 py-1.5 font-display text-[0.8125rem] font-bold transition duration-150 ease-wbw ${
              active
                ? "bg-selected text-white"
                : chips
                  ? "bg-surface3 text-muted hover:bg-surface2"
                  : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
