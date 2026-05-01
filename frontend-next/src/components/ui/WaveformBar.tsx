'use client';

export default function WaveformBar() {
  return (
    <div className="flex h-10 items-end gap-1">
      {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
        <span
          key={idx}
          className="wave-bar w-1.5 rounded-full bg-[#6C63FF]"
          style={{ height: `${16 + (idx % 4) * 6}px`, animationDelay: `${idx * 0.12}s` }}
        />
      ))}
    </div>
  );
}
