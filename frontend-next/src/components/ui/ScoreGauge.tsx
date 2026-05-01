type Props = { value: number };

export default function ScoreGauge({ value }: Props) {
  return (
    <div className="relative mx-auto h-36 w-36 rounded-full p-2" style={{ background: `conic-gradient(#6C63FF ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D1526] text-2xl font-bold text-white">
        {value}%
      </div>
    </div>
  );
}
