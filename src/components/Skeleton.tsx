export function Skeleton({ className = "h-[68px]" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl mb-2.5 ${className}`} />;
}
