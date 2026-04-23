'use client'

import { usePathname } from 'next/navigation'

function RootLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const hasFixedDashboardNav =
    pathname === "/user/dashboard" ||
    pathname === "/admin/dashboard" ||
    pathname === "/delivery/dashboard"

  return <div className={hasFixedDashboardNav ? "pt-32" : undefined}>{children}</div>
}

export default RootLayoutShell
