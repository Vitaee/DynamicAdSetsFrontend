export default function StepBadge({ step, total }: { step: number; total: number }) {
  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200 px-2.5 py-1 text-xs font-semibold dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
      {step}/{total}
    </div>
  );
}

