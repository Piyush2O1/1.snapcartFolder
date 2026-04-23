'use client'

import Link from 'next/link'
import { ArrowRight, Clock3, MapPinned, PackageCheck, ShoppingBasket, Sparkles, Truck } from 'lucide-react'
import { motion } from 'motion/react'

function HeroSection({ searchQuery, inventoryCount }: { searchQuery: string; inventoryCount: number }) {
  const heading = searchQuery
    ? `Results for "${searchQuery}"`
    : "Fresh groceries, premium flow, and a faster way to shop"

  const description = searchQuery
    ? "Quick Basket filtered your store instantly so customers can find the right essentials with less friction."
    : "Browse essentials, keep cart actions quick, and manage orders through a sharper, more polished customer experience."

  return (
    <section className="mx-auto mt-32 w-[94%] max-w-7xl">
      <div className="relative overflow-hidden rounded-[36px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#14532d_48%,#f59e0b_130%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_20%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_60%_75%,rgba(16,185,129,0.28),transparent_24%)]" />
        <div className="absolute right-8 top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-emerald-300/16 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6 text-white"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white/88">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Quick Basket customer dashboard
            </div>

            <div className="space-y-4">
              <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/user/cart"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-200"
              >
                <ShoppingBasket className="h-4 w-4" />
                Open cart
              </Link>
              <Link
                href="/user/orders"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/16"
              >
                My orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Inventory visible", value: `${inventoryCount}+ items`, icon: PackageCheck },
                { label: "Tracked handoff", value: "OTP delivery", icon: Truck },
                { label: "Fast checkout flow", value: "Responsive UX", icon: Clock3 },
              ].map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.15, duration: 0.4 }}
                  className="rounded-[24px] border border-white/10 bg-white/10 p-4"
                >
                  <Icon className="h-5 w-5 text-emerald-200" />
                  <p className="mt-4 text-xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/65">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative"
          >
            <div className="glass-panel-strong relative rounded-[32px] p-5">
              <div className="flex items-center justify-between rounded-[26px] bg-slate-950 px-5 py-4 text-white">
                <div>
                  <p className="text-sm text-white/65">Delivery speed layer</p>
                  <p className="font-display text-2xl font-semibold">Quick Basket Express</p>
                </div>
                <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Live updates
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                    <p className="text-sm text-slate-500">Active basket</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">6 essentials</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Cart actions stay close, visible, and mobile friendly.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(245,158,11,0.12))] p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Delivery route</span>
                      <span>12 min away</span>
                    </div>
                    <div className="mt-4 h-28 rounded-[20px] bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.32),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.32))]" />
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPinned className="h-4 w-4 text-emerald-700" />
                      Live tracking appears as soon as an order is assigned.
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Search and add essentials quickly",
                    "Track assigned delivery partner live",
                    "Verify secure order handoff",
                  ].map((item) => (
                    <div key={item} className="rounded-[22px] border border-white/70 bg-white/68 px-4 py-4 text-sm font-medium text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
