/**
 * The app mark shown in every page header. The gold-on-ink gear mirrors
 * `src/app/icon.svg` (the favicon).
 */
export function AppLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-lg border-2 border-gold-600 bg-gold-500 text-ink-900 shadow-[0_10px_24px_-14px_rgba(229,174,60,0.9)] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="currentColor">
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
