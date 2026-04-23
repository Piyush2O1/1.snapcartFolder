'use client'

import { ArrowLeft, EyeIcon, EyeOff, Loader2, LogIn, Lock, Mail, User } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

import BrandMark from './BrandMark'
import GoogleSignInButton from './GoogleSignInButton'

type propType = {
  previousStep: (s: number) => void
}

function RegisterForm({ previousStep }: propType) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/auth/redirect"

  const validationMessage = useMemo(() => {
    if (!name.trim() || !email.trim() || !password) return null
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address."
    if (password.length < 6) return "Password must be at least 6 characters."
    return null
  }, [email, name, password])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    try {
      await axios.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        throw new Error(result.error)
      }
      router.replace(result?.url || callbackUrl)
      router.refresh()
    } catch (error) {
      console.log(error)
      if (axios.isAxiosError(error)) {
        setFormError(error.response?.data?.message || "We could not create your account right now.")
      } else if (error instanceof Error) {
        setFormError(error.message || "We could not create your account right now.")
      } else {
        setFormError("We could not create your account right now.")
      }
    } finally {
      setLoading(false)
    }
  }

  const formValid = name.trim() !== "" && email.trim() !== "" && password !== "" && !validationMessage

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="glass-panel-strong w-full rounded-[38px] p-6 sm:p-8"
        >
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            onClick={() => previousStep(1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-6 flex justify-center">
            <BrandMark compact />
          </div>

          <div className="mt-6 space-y-3 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Create Account
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Join Quick Basket today
            </h1>
            <p className="mx-auto max-w-2xl text-slate-600">
              Start with a customer account now, then finish your profile and move into the upgraded experience.
            </p>
          </div>

          {(formError || validationMessage) && (
            <div className="mx-auto mt-6 max-w-xl rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {formError || validationMessage}
            </div>
          )}

          <motion.form onSubmit={handleRegister} className="mx-auto mt-8 max-w-xl space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-[24px] border border-white/80 bg-white/78 py-4 pl-12 pr-4 text-slate-800 outline-none focus:border-emerald-300"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>

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
              disabled={!formValid || loading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold transition ${
                formValid ? "bg-slate-950 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Register"}
            </button>

            <GoogleSignInButton callbackUrl={callbackUrl} />
          </motion.form>

          <p
            className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600"
            onClick={() => router.push(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`)}
          >
            Already have an account?
            <LogIn className="h-4 w-4 text-emerald-700" />
            <span className="font-semibold text-emerald-700">Sign in</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterForm
