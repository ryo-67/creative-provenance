'use client';

type Props = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number | undefined;
  onChange: (x: number) => void;
};

export default function PositionDot({ label, leftLabel, rightLabel, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{label}</h2>
      <p className="text-sm text-zinc-500">Placeholder: drag or click to position.</p>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">{leftLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={(value ?? 0.5) * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="flex-1"
        />
        <span className="text-sm text-zinc-500">{rightLabel}</span>
      </div>
      <pre className="mt-4 rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
        {JSON.stringify({ x: value }, null, 2)}
      </pre>
    </div>
  );
}
