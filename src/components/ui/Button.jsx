import { forwardRef } from "react";

const VARIANTS = {
  accent: "bg-accent text-white shadow-action hover:bg-accent-hover",
  neutral: "bg-raised text-ink shadow-soft hover:bg-surface2",
  soft: "bg-surface2 text-ink hover:bg-surface3",
  outline:
    "border border-selected bg-selected-soft text-selected-text hover:bg-selected hover:text-white",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-ink hover:bg-surface2",
};

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

/** Props: variant (accent|neutral|soft|outline|danger|ghost), size (sm|md|lg), leftIcon, className. */
const Button = forwardRef(function Button(
  { variant = "accent", size = "md", type = "button", leftIcon, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-display font-bold transition duration-150 ease-wbw disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] || VARIANTS.accent
      } ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
});

export default Button;
