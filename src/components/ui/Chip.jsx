import { forwardRef } from "react";

/** Props: as (element/component, default "span"), tone (inline style override e.g. { background, color }), className. */
const Chip = forwardRef(function Chip(
  { as: Tag = "span", tone, className = "", style, children, ...rest },
  ref,
) {
  // Default background only when the caller supplies none (CSS source order would otherwise let bg-surface2 win).
  const hasBg =
    Boolean(tone && (tone.background || tone.backgroundColor)) ||
    /(^|\s)!?bg-/.test(className);
  const hasText =
    Boolean(tone && tone.color) ||
    /(^|\s)!?text-(?!\[?\d|xs|sm|base|lg|xl|left|center|right|wrap|nowrap|ellipsis)/.test(className);
  return (
    <Tag
      ref={ref}
      className={`inline-flex items-center gap-1 rounded-full ${hasBg ? "" : "bg-surface2"} px-2.5 py-0.5 font-sans text-[0.8125rem] font-semibold leading-5 ${hasText ? "" : "text-ink"} ${className}`}
      style={tone ? { ...tone, ...style } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default Chip;
