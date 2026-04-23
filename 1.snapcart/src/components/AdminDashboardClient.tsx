'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Boxes, IndianRupee, Package, Truck, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useRouter } from 'next/navigation'

import { getSocket } from '@/lib/socket'

type EarningFilter = "today" | "sevenDays" | "total"

type propType = {
  earning: {
    today: number
    sevenDays: number
    total: number
  }
  stats: {
    title: string
    value: number
  }[]
  chartData: {
    day: string
    orders: number
  }[]
}

function AdminDashboardClient({ earning, stats, chartData }: propType) {
  const [filter, setFilter] = useState<EarningFilter>("total")
  const router = useRouter()

  useEffect(() => {
    const socket = getSocket()
    const refreshDashboard = () => router.refresh()

    socket.on("new-order", refreshDashboard)
    socket.on("order-status-update", refreshDashboard)
    socket.on("order-assigned", refreshDashboard)
    socket.on("assignment-updated", refreshDashboard)

    return () => {
      socket.off("new-order", refreshDashboard)
      socket.off("order-status-update", refreshDashboard)
      socket.off("order-assigned", refreshDashboard)
      socket.off("assignment-updated", refreshDashboard)
    }
  }, [router])

  const currentEarning =
    filter === "today" ? earning.today : filter === "sevenDays" ? earning.sevenDays : earning.total

  const title =
    filter === "today" ? "Today's revenue" : filter === "sevenDays" ? "Last 7 days revenue" : "Total revenue"

  const icons = [Package, Users, Truck, Boxes]
  const tones = [
    "bg-emerald-100 text-emerald-800",
    "bg-sky-100 text-sky-800",
    "bg-amber-100 text-amber-800",
    "bg-slate-900 text-white",
  ]

  return (
    <div className="mx-auto w-[94%] max-w-7xl pb-16 pt-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
            Operations Hub
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Quick Basket admin dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Revenue, order flow, and grocery operations now sit inside a cleaner, more premium command surface.
          </p>
        </motion.div>

        <select
          className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 outline-none shadow-sm transition hover:bg-white"
          onChange={(e) => setFilter(e.target.value as EarningFilter)}
          value={filter}
        >
          <option value="total">Total</option>
          <option value="sevenDays">Last 7 Days</option>
          <option value="today">Today</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel-dark rounded-[32px] p-6 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-emerald-200">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-white/60">{title}</p>
              <p className="font-display text-4xl font-bold text-white">Rs. {currentEarning.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
            Switch time ranges instantly and keep an eye on how Quick Basket is performing across recent demand windows.
          </p>
        </motion.div>

        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
            Live focus
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Orders today", value: chartData.at(-1)?.orders || 0 },
              { label: "Pending deliveries", value: stats.find((item) => item.title === "Pending Deliveries")?.value || 0 },
              { label: "Customers", value: stats.find((item) => item.title === "Total Customers")?.value || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = icons[index]
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="glass-panel rounded-[28px] p-5"
            >
              <div className={`inline-flex rounded-2xl p-3 ${tones[index]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
              <p className="mt-1 text-sm text-slate-600">{item.title}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="glass-panel-strong mt-6 rounded-[32px] p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">
              Order Overview
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              Last 7 days activity
            </h2>
          </div>
          <p className="text-sm text-slate-600">This chart updates as new orders arrive or delivery state changes.</p>
        </div>

        <div className="mt-8 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#dbe4e8" strokeDasharray="4 4" />
              <XAxis dataKey="day" stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardClient
