import EmptyState from './EmptyState';

export default function RouteErrorElement() {
  return (
    <div className="min-h-screen bg-[rgb(var(--wt-surface))] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <EmptyState
          title="Page Not Found"
          description="The page you're looking for doesn't exist or has been moved."
          action={
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          }
        />
      </div>
    </div>
  );
}