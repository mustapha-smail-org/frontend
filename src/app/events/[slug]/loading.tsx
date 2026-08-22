export default function LoadingEvent() {
  return (
    <div className="shell-pad py-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="aspect-[4/3] animate-pulse rounded-lg bg-[#ddd7ca]" />
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[#ddd7ca]" />
          <div className="h-16 w-full animate-pulse rounded bg-[#ddd7ca]" />
          <div className="h-16 w-2/3 animate-pulse rounded bg-[#ddd7ca]" />
        </div>
      </div>
    </div>
  );
}
