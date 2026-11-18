import { forwardRef } from "react";

/** Props: as (default "div"), padded (adds p-5), className. */
const Card = forwardRef(function Card(
  { as: Tag = "div", padded = false, className = "", children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={`rounded-card bg-raised shadow-soft ${padded ? "p-5" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default Card;
