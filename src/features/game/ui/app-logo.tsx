/**
 * The app mark shown next to the "Industrins Svenska" title in every page header.
 * The gear artwork and the gradient mirror `src/app/icon.svg` (the favicon).
 */
export function AppLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-amber-400 to-yellow-400 text-slate-950 shadow-lg glow-yellow ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[60%] w-[60%]" fill="currentColor">
        <defs>
          <mask id="app-logo-hub">
            <rect width="32" height="32" fill="#ffffff" />
            <circle cx="16" cy="16" r="2.5" fill="#000000" />
          </mask>
        </defs>
        <g mask="url(#app-logo-hub)">
          <circle cx="16" cy="16" r="6.5" />
          <rect x="14.625" y="7.5" width="2.75" height="4" rx="0.875" />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(45 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(90 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(135 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(180 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(225 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(270 16 16)"
          />
          <rect
            x="14.625"
            y="7.5"
            width="2.75"
            height="4"
            rx="0.875"
            transform="rotate(315 16 16)"
          />
        </g>
      </svg>
    </span>
  );
}
