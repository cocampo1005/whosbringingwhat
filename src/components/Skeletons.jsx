/*
 * Loading placeholders. Each one borrows the grid and card classes of the content it stands in
 * for, so the page does not jump when the data arrives. They are shapes only: the wrapper carries
 * the "Loading" announcement for screen readers.
 */

function Bone({ className = "" }) {
  return <div className={`animate-pulse rounded-full bg-surface3 ${className}`} />;
}

function Busy({ label, className = "", children }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const keys = (count) => Array.from({ length: count }, (_, i) => i);

/** The Events grid: same columns, card and media height as EventCard. */
export function EventGridSkeleton({ count = 3 }) {
  return (
    <Busy
      label="Loading events"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {keys(count).map((i) => (
        <div
          key={i}
          className="flex w-full flex-col rounded-card bg-white px-2 pb-4 pt-2 shadow-soft"
        >
          <Bone className="h-[170px] w-full !rounded-2xl lg:h-[148px]" />
          <div className="flex flex-col gap-2.5 px-2 pt-4">
            <Bone className="h-5 w-3/4" />
            <Bone className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </Busy>
  );
}

/** The My Items grid: one card per event with a date chip, a title and item rows. */
export function MyItemsSkeleton({ count = 3 }) {
  return (
    <Busy
      label="Loading your items"
      className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {keys(count).map((i) => (
        <div key={i} className="rounded-card bg-raised p-5 shadow-soft">
          <Bone className="h-5 w-32" />
          <Bone className="mt-4 h-5 w-2/3" />
          <Bone className="mt-2.5 h-3.5 w-1/2" />
          <div className="mt-6 flex flex-col gap-3">
            {keys(2).map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Bone className="h-9 w-9 shrink-0" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Bone className="h-3.5 w-2/3" />
                  <Bone className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Busy>
  );
}

/** The event page: hero block, category strip, then the category columns. */
export function EventDetailsSkeleton() {
  return (
    <Busy label="Loading event" className="pb-4">
      <div className="flex min-h-[24rem] animate-pulse flex-col justify-end gap-3 rounded-card bg-surface3 p-5 md:p-8 lg:min-h-[22rem]">
        <div className="h-6 w-28 rounded-full bg-raised/70" />
        <div className="h-10 w-3/4 rounded-full bg-raised/70 md:w-1/2" />
        <div className="h-4 w-1/2 rounded-full bg-raised/70 md:w-1/3" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {keys(5).map((i) => (
          <Bone key={i} className="h-9 w-24" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-3 md:mt-5 md:grid-cols-3 lg:grid-cols-5">
        {keys(5).map((i) => (
          <div key={i} className="rounded-card bg-surface2 p-3">
            <div className="flex items-center gap-2.5">
              <Bone className="h-9 w-9 shrink-0" />
              <Bone className="h-4 w-1/2" />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {keys(2).map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2.5 rounded-2xl bg-raised p-3 shadow-chip"
                >
                  <Bone className="h-8 w-8 shrink-0" />
                  <Bone className="h-3.5 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Rows of an avatar and a name, for the participants sheet. */
export function ParticipantsSkeleton({ count = 4 }) {
  return (
    <Busy label="Loading participants" className="flex flex-col gap-4">
      {keys(count).map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-10 w-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Busy>
  );
}
