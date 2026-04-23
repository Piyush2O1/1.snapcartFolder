'use client'

import googleImage from "@/assets/google.png"
import Image from 'next/image'
import { getProviders, signIn } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

function GoogleSignInButton({ callbackUrl = "/auth/redirect" }: { callbackUrl?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkProviders = async () => {
      const providers = await getProviders()
      if (!cancelled) {
        setEnabled(Boolean(providers?.google))
      }
    }

    checkProviders()

    return () => {
      cancelled = true
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div className='mt-2 flex items-center gap-2 text-sm text-slate-400'>
        <span className='h-px flex-1 bg-slate-200'></span>
        OR
        <span className='h-px flex-1 bg-slate-200'></span>
      </div>

      <button
        type='button'
        className='flex w-full items-center justify-center gap-3 rounded-full border border-white/80 bg-white/78 py-3 text-slate-700 font-medium transition-all duration-200 hover:bg-white'
        onClick={() => signIn("google", { callbackUrl })}
      >
        <Image src={googleImage} width={20} height={20} alt='google' />
        Continue with Google
      </button>
    </>
  )
}

export default GoogleSignInButton
