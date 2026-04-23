'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import useGetMe from './hooks/useGetMe'

const protectedRoutePrefixes = ["/user", "/delivery", "/admin"]

function InitUser() {
  const { status } = useSession()
  const pathname = usePathname()

  useGetMe(
    status === 'authenticated' &&
      protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix)),
  )

  return null
}

export default InitUser
