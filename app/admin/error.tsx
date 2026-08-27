'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged with full detail so the exact crash (component, message, stack)
    // is visible in the browser console instead of a silent blank page.
    console.error('[AdminError boundary] Uncaught error in admin section:', error);
    console.error('[AdminError boundary] Digest:', error.digest);
    console.error('[AdminError boundary] Stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-4 text-center">
        <AlertTriangle size={36} className="mx-auto text-red-400" />
        <h1 className="text-lg font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-gray-300">{error.message || 'An unexpected error occurred while rendering this page.'}</p>
        {error.digest && (
          <p className="text-xs text-gray-500">Error reference: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-sm hover:bg-indigo-500/30 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
