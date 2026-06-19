export default function ScoreBadge({ category, score }) {
  const cfg = {
    HOT:  { cls: 'badge-hot',  dot: 'bg-red-500' },
    WARM: { cls: 'badge-warm', dot: 'bg-yellow-500' },
    COLD: { cls: 'badge-cold', dot: 'bg-blue-500' },
  };
  const { cls, dot } = cfg[category] || cfg.COLD;
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1.5 inline-block`} />
      {category} {score !== undefined && `· ${score}`}
    </span>
  );
}
