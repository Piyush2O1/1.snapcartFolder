'use client'

import React from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Bike, ShoppingBasket, Sparkles, Truck } from 'lucide-react'

import BrandMark from './BrandMark'

type propType = {
  nextStep: (s: number) => void
}

function Welcome({ nextStep }: propType) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-panel-strong w-full rounded-[38px] p-6 text-center sm:p-10"
        >
          <div className="flex justify-center">
            <BrandMark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mx-auto mt-8 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              <Sparkles className="h-4 w-4" />
              Premium grocery storefront
            </div>
            <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Join Quick Basket and launch a sharper grocery experience.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Build your account, complete your profile, and move into a cleaner shopping, delivery, and operations flow.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              { icon: ShoppingBasket, title: "Faster shopping", text: "Responsive browsing and better cart controls." },
              { icon: Bike, title: "Cleaner delivery flow", text: "Assignments, route, chat, and OTP in one place." },
              { icon: Truck, title: "Production-ready polish", text: "Branded surfaces designed for real usage." },
            ].map(({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 + 0.16, duration: 0.4 }}
                className="rounded-[28px] border border-white/80 bg-white/72 p-6 text-left"
              >
                <div className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-display mt-5 text-2xl font-semibold text-slate-950">{title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
            onClick={() => nextStep(2)}
          >
            Create account
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default Welcome
