export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} aria-hidden="true" />
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger bg-white p-4">
      <p className="font-semibold text-danger">Could not load data</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm"
        >
          Try again
        </button>
      )}
    </div>
  )
}
