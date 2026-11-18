import { forwardRef } from "react";

const VARIANTS = {
  neutral: "bg-raised text-ink shadow-chip hover:bg-surface2",
  soft: "bg-surface2 text-ink hover:bg-surface3",
  danger: "bg-raised text-danger shadow-chip hover:bg-accent-soft",
  accent: "bg-accent text-white shadow-action hover:bg-accent-hover",
};

const SIZES = { 36: "h-9 w-9", 44: "h-11 w-11" };

/** Props: aria-label (required), variant (neutral|soft|danger|accent), size (36|44), className. */
const IconButton = forwardRef(function IconButton(
  { variant = "neutral", size = 36, type = "button", className = "", children, ...rest },
  ref,
) {
  if (import.meta.env?.DEV && !rest["aria-label"]) {
    console.warn("IconButton requires an aria-label prop.");
  }
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition duration-150 ease-wbw disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] || VARIANTS.neutral
      } ${SIZES[size] || SIZES[36]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
