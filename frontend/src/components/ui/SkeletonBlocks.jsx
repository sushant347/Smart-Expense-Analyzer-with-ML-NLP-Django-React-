import React from 'react';

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function SkeletonBlock({ className = '', style }) {
  return <div className={joinClasses('skeleton rounded-xl', className)} style={style} aria-hidden="true" />;
}

export function ChartPanelSkeleton({ className = '', heightClass = 'h-56' }) {
  return (
    <div className={joinClasses('card p-4 sm:p-5', className)} aria-hidden="true">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SkeletonBlock className="h-4 w-32 rounded-lg" />
        <SkeletonBlock className="h-6 w-20 rounded-md" />
      </div>
      <SkeletonBlock className={joinClasses('w-full', heightClass)} />
    </div>
  );
}

export function TablePanelSkeleton({ className = '', rows = 6, headerCount = 5 }) {
  return (
    <div className={joinClasses('card overflow-hidden', className)} aria-hidden="true">
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--stroke-soft)' }}>
        <div className="flex items-center gap-2">
          {Array.from({ length: headerCount }).map((_, idx) => (
            <SkeletonBlock key={`header-${idx}`} className="h-3 flex-1 rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={`row-${idx}`} className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-20 rounded-md" />
            <SkeletonBlock className="h-4 flex-1 rounded-md" />
            <SkeletonBlock className="h-4 w-20 rounded-md" />
            <SkeletonBlock className="h-4 w-16 rounded-md" />
            <SkeletonBlock className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPanelSkeleton({ className = '', rows = 5 }) {
  return (
    <div className={joinClasses('card p-4 sm:p-5', className)} aria-hidden="true">
      <div className="mb-4 flex items-center justify-between">
        <SkeletonBlock className="h-4 w-36 rounded-lg" />
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={`list-row-${idx}`}
            className="rounded-lg px-3 py-3"
            style={{ border: '1px solid var(--stroke-soft)' }}
          >
            <SkeletonBlock className="h-4 w-2/3 rounded-md" />
            <SkeletonBlock className="mt-2 h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
