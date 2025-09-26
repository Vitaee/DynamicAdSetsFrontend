export default function Spinner({ size = 20 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <svg className="animate-spin text-indigo-600" width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

