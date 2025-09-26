export default function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ? '' : ''}`}>
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 16a5 5 0 0 1 1.2-9.88A6 6 0 0 1 20 10.5h.5A3.5 3.5 0 0 1 24 14a3.5 3.5 0 0 1-3.5 3.5H8.5A3.5 3.5 0 0 1 5 14c0-.4.07-.78.2-1.14" />
      </svg>
      <span className="text-lg font-semibold text-foreground">WeatherTrigger</span>
    </div>
  );
}

