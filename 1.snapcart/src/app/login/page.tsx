'use client'

import { EyeIcon, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { FormEvent, Suspense, useState } from 'react'

import BrandMark from '@/components/BrandMark'
import GoogleSignInButton from '@/components/GoogleSignInButton'

const getFriendlyAuthError = (error?: string | null) => {
  if (!error) return null

  if (error === "database_unavailable") {
    return "Login is temporarily unavailable because the database connection failed."
  }

  if (error === "CredentialsSignin") {
    return "Invalid email or password."
  }

  if (error === "CallbackRouteError" || error === "Configuration") {
    return "We could not complete login right now. Please try again in a moment."
  }

  if (/incorrect password/i.test(error)) {
    return "Incorrect password."
  }

  if (/user does not exist/i.test(error)) {
    return "No account was found with that email."
  }

  if (/querySrv|ECONNREFUSED|server selection/i.test(error)) {
    return "Login is temporarily unavailable because the database connection failed."
  }

  return "We could not complete login right now. Please try again."
}

function LoginFallback() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="glass-panel-strong flex w-full max-w-xl items-center justify-center rounded-[36px] p-10">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        </div>
      </div>
    </div>
  )
}

function LoginContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/auth/redirect"

  const errorMessage = formError || getFriendlyAuthError(searchParams.get("error"))

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setFormError("Enter a valid email address.")
        return
      }

      if (!password) {
        setFormError("Enter your password.")
        return
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setFormError(getFriendlyAuthError(result.error))
        return
      }

      const nextUrl = new URL(result?.url || callbackUrl, window.location.origin)
      const nextPath =
        nextUrl.origin === window.location.origin
          ? `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
          : "/"

      router.replace(nextPath)
      router.refresh()
    } catch (error) {
      setFormError(getFriendlyAuthError(error instanceof Error ? error.message : null))
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const formValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password !== ""

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_26%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-panel-dark hidden rounded-[36px] p-8 text-white lg:block"
        >
          <BrandMark light />
          <h1 className="font-display mt-8 text-5xl font-bold leading-tight tracking-tight">
            Login to the smarter Quick Basket experience.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
            Customers get smoother shopping. Delivery teams get cleaner controls. Admins get a more polished command surface.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              "Responsive storefront with cleaner search and browsing",
              "Premium delivery dashboard with route, OTP, and chat flow",
              "Quick Basket branding across the whole application",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/8 px-5 py-4 text-sm text-white/78">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="glass-panel-strong mx-auto w-full max-w-xl rounded-[36px] p-6 sm:p-8"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark compact />
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Welcome Back
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950">
              Login to Quick Basket
            </h2>
            <p className="text-slate-600">
              Continue to your dashboard, cart, orders, or delivery control center.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {errorMessage}
            </div>
          )}

          <motion.form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-12 text-slate-800 outline-none focus:border-emerald-300"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              {showPassword ? (
                <EyeOff
                  className="absolute right-4 top-4 h-5 w-5 cursor-pointer text-slate-500"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <EyeIcon
                  className="absolute right-4 top-4 h-5 w-5 cursor-pointer text-slate-500"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={!formValid || loading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold transition ${
                formValid ? "bg-slate-950 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </button>

            <GoogleSignInButton callbackUrl={callbackUrl} />
          </motion.form>

          <p
            className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600 lg:justify-start"
            onClick={() => router.push(`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`)}
          >
            Need a new account?
            <LogIn className="h-4 w-4 text-emerald-700" />
            <span className="font-semibold text-emerald-700">Sign up</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
