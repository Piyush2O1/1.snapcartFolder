'use client'

import {
  Apple,
  Baby,
  Box,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Flame,
  Heart,
  Home,
  Milk,
  Wheat,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

const categories = [
  { id: 1, name: "Fruits and Vegetables", icon: Apple, accent: "from-emerald-200 via-white to-emerald-50" },
  { id: 2, name: "Dairy and Eggs", icon: Milk, accent: "from-amber-100 via-white to-amber-50" },
  { id: 3, name: "Rice, Atta and Grains", icon: Wheat, accent: "from-orange-100 via-white to-orange-50" },
  { id: 4, name: "Snacks and Biscuits", icon: Cookie, accent: "from-rose-100 via-white to-rose-50" },
  { id: 5, name: "Spices and Masalas", icon: Flame, accent: "from-red-100 via-white to-red-50" },
  { id: 6, name: "Beverages and Drinks", icon: Coffee, accent: "from-sky-100 via-white to-sky-50" },
  { id: 7, name: "Personal Care", icon: Heart, accent: "from-fuchsia-100 via-white to-fuchsia-50" },
  { id: 8, name: "Household Essentials", icon: Home, accent: "from-lime-100 via-white to-lime-50" },
  { id: 9, name: "Instant and Packaged Food", icon: Box, accent: "from-cyan-100 via-white to-cyan-50" },
  { id: 10, name: "Baby and Pet Care", icon: Baby, accent: "from-pink-100 via-white to-pink-50" },
]

function CategorySlider() {
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = direction === "left" ? -320 : 320
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 0)
    setShowRight(scrollLeft + clientWidth <= scrollWidth - 10)
  }

  useEffect(() => {
    const slider = scrollRef.current
    slider?.addEventListener("scroll", checkScroll)
    checkScroll()
    return () => slider?.removeEventListener("scroll", checkScroll)
  }, [])

  return (
    <motion.section
      className="mx-auto mt-10 w-[94%] max-w-7xl"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Shop by Category
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Browse the aisles faster
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Tap a category to filter the store instantly and move through popular grocery lanes with less friction.
        </p>
      </div>

      <div className="relative">
        {showLeft && (
          <button
            className="glass-panel absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="scrollbar-hide flex gap-4 overflow-x-auto px-1 pb-4 pt-1 sm:px-12" ref={scrollRef}>
          {categories.map((cat, index) => {
            const Icon = cat.icon
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                onClick={() => router.push(`/user/dashboard?category=${encodeURIComponent(cat.name)}`)}
                className={`min-w-[220px] rounded-[28px] border border-white/80 bg-linear-to-br ${cat.accent} p-5 text-left shadow-[0_16px_44px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,23,42,0.12)]`}
              >
                <div className="mb-6 inline-flex rounded-2xl bg-white/80 p-3 text-emerald-700 shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-display text-xl font-semibold text-slate-950">{cat.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Curated essentials and fast category-first filtering.
                </p>
              </motion.button>
            )
          })}
        </div>

        {showRight && (
          <button
            className="glass-panel absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.section>
  )
}

export default CategorySlider
