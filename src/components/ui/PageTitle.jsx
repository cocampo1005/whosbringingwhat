/** Props: title, subtitle, actions (node, right-aligned), avatarSlot (node before the title), className. */
export default function PageTitle({ title, subtitle, actions, avatarSlot, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        {avatarSlot}
        <div className="min-w-0">
          <h1 className="text-[1.875rem] leading-none md:text-[2.5rem] lg:text-[2.75rem]">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-[0.8125rem] text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
