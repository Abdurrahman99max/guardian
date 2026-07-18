import { cn } from '@/lib/utils';

type LoadingStateProps = { label?: string; className?: string };

function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={cn('text-text-secondary flex items-center gap-3 text-sm', className)}
    >
      <span
        aria-hidden
        className="bg-guardian-blue size-2 rounded-full motion-safe:animate-pulse"
      />
      <span>{label}</span>
    </div>
  );
}

export { LoadingState };
