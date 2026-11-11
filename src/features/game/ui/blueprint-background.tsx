export function BlueprintBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-750" />
      <div className="blueprint-grid absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(89,102,243,0.14),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,rgba(229,174,60,0.07),transparent_55%)]" />
    </div>
  );
}
