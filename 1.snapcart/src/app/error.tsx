'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const databaseIssue = /database|server selection|timed out|ETIMEDOUT/i.test(error.message)

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="glass-panel-strong w-full max-w-2xl rounded-[36px] p-8 text-center sm:p-10">
          <div className="mx-auto inline-flex rounded-full bg-amber-100 p-4 text-amber-700">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <p className="font-display mt-6 text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Something Went Wrong
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {databaseIssue ? "We could not reach the database." : "This page hit an unexpected issue."}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            {databaseIssue
              ? "The app is reachable, but data could not be loaded right now. Please try again in a moment."
              : "Please retry this action. If it keeps happening, return to the dashboard and try a different path."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/78 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-white"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
