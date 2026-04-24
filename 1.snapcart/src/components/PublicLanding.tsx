'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Bike,
  Clock3,
  Leaf,
  PackageCheck,
  Route,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'

import BrandMark from './BrandMark'
import Footer from './Footer'

const navigationLinks = [
  { label: "Features", href: "#features" },
  { label: "Delivery", href: "#delivery" },
  { label: "Categories", href: "#categories" },
]

const featureCards = [
  {
    title: "Fast grocery browsing",
    description: "Search, cart, checkout, and live order updates in one smooth flow.",
    icon: ShoppingBasket,
  },
  {
    title: "Sharper delivery ops",
    description: "Assignment handling, OTP verification, routing, and customer chat stay together.",
    icon: Route,
  },
  {
    title: "Reliable customer trust",
    description: "Clear order status, live tracking, and secure handoff keep delivery handovers clean.",
    icon: ShieldCheck,
  },
]

const deliveryHighlights = [
  "Live assignment board for nearby riders",
  "OTP-driven delivery confirmation",
  "Integrated route launch and live map visibility",
  "In-app customer chat for faster coordination",
]

const categories = [
  "Fresh Fruits",
  "Vegetables",
  "Dairy",
  "Breakfast",
  "Snacks",
  "Household",
  "Beverages",
  "Daily Essentials",
]

function PublicLanding() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_30%)]" />

      <header className="sticky top-4 z-40 px-4">
        <div className="glass-panel-strong mx-auto flex max-w-7xl items-center justify-between rounded-[30px] px-4 py-3 sm:px-6">
          <BrandMark />

          <nav className="hidden items-center gap-7 lg:flex">
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login?reauth=1"
              className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Login
            </Link>
            <Link
              href="/register?reauth=1"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:pb-24">
        <section className="grid min-h-[calc(100vh-8.5rem)] items-center gap-12 lg:grid-cols-[1.06fr_0.94fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-7"
          >
            <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-emerald-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick Basket for premium grocery delivery
            </div>

            <div className="space-y-5">
              <h1 className="font-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Your grocery storefront, dispatch flow, and customer delivery layer in one polished app.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Quick Basket keeps the shopping experience fast for customers while giving admins and delivery partners a cleaner, smarter workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?reauth=1"
                className="shine-sweep inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-700"
              >
                Start with Quick Basket
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?reauth=1"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/65 px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                Existing team login
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Average order prep", value: "12 min", icon: Clock3 },
                { label: "Delivery handoff flow", value: "OTP verified", icon: PackageCheck },
                { label: "Customer trust layer", value: "Live tracking", icon: Truck },
              ].map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.45 }}
                  className="glass-panel rounded-[26px] p-5"
                >
                  <Icon className="mb-4 h-5 w-5 text-emerald-700" />
                  <p className="text-2xl font-bold text-slate-950">{value}</p>
                  <p className="mt-1 text-sm text-slate-600">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.12 }}
            className="relative"
          >
            <div className="absolute -left-8 top-6 h-36 w-36 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute bottom-10 right-0 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />

            <div className="glass-panel-strong bg-grid relative overflow-hidden rounded-[34px] p-4 sm:p-6">
              <div className="absolute inset-x-8 top-0 h-32 rounded-b-[42px] bg-[linear-gradient(180deg,rgba(16,185,129,0.16),transparent)]" />

              <div className="relative flex items-center justify-between rounded-[28px] bg-slate-950 px-5 py-4 text-white">
                <div>
                  <p className="text-sm text-white/70">Control Center</p>
                  <p className="font-display text-2xl font-semibold">Quick Basket Flow</p>
                </div>
                <div className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/90">
                  Responsive UI
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="glass-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Store activity</p>
                        <p className="mt-1 text-2xl font-bold text-slate-950">128 orders today</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <Store className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <Leaf className="h-4 w-4 text-emerald-700" />
                      Inventory, delivery, and support stay in sync.
                    </div>
                  </div>

                  <div className="glass-panel rounded-[28px] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Delivery partner lane</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">4 new assignments</p>
                      </div>
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                        <Bike className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {["Accept ride", "Open route", "Verify OTP"].map((step) => (
                        <div
                          key={step}
                          className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-sm text-slate-700"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-panel-dark float-soft rounded-[30px] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/65">Active order</p>
                      <p className="mt-1 font-display text-3xl font-semibold">Order QB-2047</p>
                    </div>
                    <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Out for delivery
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>Customer</span>
                        <span>17 min ETA</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">Riya Mehta</p>
                      <p className="text-sm text-white/70">Sunrise Avenue, Sector 11</p>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(255,255,255,0.04))] p-4">
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>Live route</span>
                        <span>2.4 km left</span>
                      </div>
                      <div className="mt-4 h-28 rounded-[22px] bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.35),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/65">OTP stage</p>
                        <p className="mt-2 text-xl font-semibold text-white">Secure handoff</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/65">Chat</p>
                        <p className="mt-2 text-xl font-semibold text-white">Quick replies</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="pt-8 sm:pt-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Product Experience
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              A sharper customer and operations experience across the whole app.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="glass-panel rounded-[28px] p-6"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="delivery" className="grid gap-6 pt-12 lg:grid-cols-[0.92fr_1.08fr] sm:pt-16">
          <div className="glass-panel rounded-[32px] p-7">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-amber-600">
              Delivery System
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Delivery partners get a cleaner dashboard with fewer handoff mistakes.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              We keep the rider flow simple: pick a job, navigate fast, coordinate with the customer, and close the order with OTP verification.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Available jobs", value: "Live queue" },
                { label: "Location updates", value: "Automatic" },
                { label: "Customer connect", value: "Chat + call" },
                { label: "Order closure", value: "OTP verify" },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/70 bg-white/60 p-4">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-strong rounded-[32px] p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
                  What improves
                </p>
                <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                  Better clarity at each delivery step
                </h3>
              </div>
              <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Glass UI
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {deliveryHighlights.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white/62 px-5 py-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 font-display text-lg font-bold text-emerald-700">
                    0{index + 1}
                  </div>
                  <p className="text-base font-medium text-slate-700">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="categories" className="pt-12 sm:pt-16">
          <div className="glass-panel-strong rounded-[34px] p-7 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
                  Browse Fast
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Popular grocery lanes customers expect to find instantly
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                <Users className="h-4 w-4" />
                Responsive on mobile and desktop
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="gradient-ring rounded-[26px]"
                >
                  <div className="glass-panel h-full rounded-[26px] p-5">
                    <div className="mb-6 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <p className="font-display text-2xl font-semibold text-slate-950">{item}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Clean category browsing with stronger visual hierarchy and faster scanning.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-12 sm:pt-16">
          <div className="glass-panel-dark overflow-hidden rounded-[36px] p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                  Ready to launch
                </p>
                <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Move from a basic storefront to a branded Quick Basket experience.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                  Customers get a premium landing page and smoother shopping flow. Delivery partners and admins get a cleaner dashboard for real operations.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/register?reauth=1"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
                >
                  Create account
                </Link>
                <Link
                  href="/login?reauth=1"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/16"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer role="guest" />
    </div>
  )
}

export default PublicLanding
