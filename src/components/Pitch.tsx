import { UserPlus } from "lucide-react";
import { SLOTS, overallAverage, type Board, type PositionKey } from "@/lib/scouting";

export function Pitch({
  board,
  onSelect,
}: {
  board: Board;
  onSelect: (key: PositionKey) => void;
}) {
  return (
    <div className="pitch-surface relative mx-auto aspect-[2/3] w-full max-w-2xl overflow-hidden rounded-2xl border-2 pitch-line shadow-lg">
      {/* markings */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border-2 pitch-line" />
      <div className="pointer-events-none absolute left-3 right-3 top-1/2 border-t-2 pitch-line" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[16%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 pitch-line" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[14%] w-[54%] -translate-x-1/2 border-2 border-b-0 pitch-line" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[6%] w-[28%] -translate-x-1/2 border-2 border-b-0 pitch-line" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[14%] w-[54%] -translate-x-1/2 border-2 border-t-0 pitch-line" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[6%] w-[28%] -translate-x-1/2 border-2 border-t-0 pitch-line" />

      {SLOTS.map((slot) => {
        const data = board[slot.key];
        const filled = Boolean(data?.athlete.fullName);
        const media = data ? overallAverage(data.evaluation.scores) : 0;
        return (
          <button
            key={slot.key}
            type="button"
            onClick={() => onSelect(slot.key)}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            className="absolute w-[19%] max-w-[104px] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            aria-label={`${slot.name}${filled ? `: ${data?.athlete.fullName}` : " (vago)"}`}
          >
            <span className="mx-auto block aspect-square w-full overflow-hidden rounded-full border-2 border-gold bg-pitch-dark/80 shadow-md transition-transform active:scale-95">
              {filled && data?.athlete.photo ? (
                <img
                  src={data.athlete.photo}
                  alt={data.athlete.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-primary-foreground">
                  {filled ? (
                    <span className="font-display text-2xl leading-none">{slot.label}</span>
                  ) : (
                    <UserPlus className="h-1/3 w-1/3 opacity-80" />
                  )}
                </span>
              )}
            </span>
            <span className="mt-1 block truncate rounded-md bg-pitch-dark/85 px-1 py-0.5 text-center text-[10px] font-semibold text-primary-foreground sm:text-xs">
              {filled ? data?.athlete.fullName.split(" ")[0] : slot.label}
            </span>
            {filled && media > 0 && (
              <span className="mx-auto mt-0.5 block w-fit rounded bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">
                {media.toFixed(1)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
