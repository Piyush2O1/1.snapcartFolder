'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Bike, ShieldCheck, User } from 'lucide-react'
import axios from 'axios'
import { AxiosError } from 'axios'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDispatch } from 'react-redux'

import { getDashboardPath } from '@/lib/appRoutes'
import { AppDispatch } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import BrandMark from './BrandMark'

function EditRoleMobile() {
  const [roles, setRoles] = useState([
    { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Manage groceries, orders, and operations." },
    { id: "user", label: "Customer", icon: User, desc: "Browse groceries, place orders, and track deliveries." },
    { id: "deliveryBoy", label: "Delivery Partner", icon: Bike, desc: "Accept deliveries, navigate routes, and verify OTP." },
  ])
  const [selectedRole, setSelectedRole] = useState("")
  const [mobile, setMobile] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { update } = useSession()
  const dispatch = useDispatch<AppDispatch>()

  const router = useRouter()

  const handleEdit = async () => {
    try {
      setLoading(true)
      setErrorMessage("")
      const result = await axios.post("/api/user/edit-role-mobile", {
        role: selectedRole,
        mobile,
      })
      dispatch(setUserData(result.data))
      await update({ role: selectedRole })

      router.replace(getDashboardPath(selectedRole))
      router.refresh()
    } catch (error) {
      console.log(error)
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : "We could not save your profile right now."
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkForAdmin = async () => {
      try {
        const result = await axios.get("/api/check-for-admin")
        if (result.data.adminExist) {
          setRoles((prev) => prev.filter((r) => r.id !== "admin"))
        }
      } catch (error) {
        console.log(error)
      }
    }
    void checkForAdmin()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="glass-panel-strong w-full rounded-[38px] p-6 sm:p-10">
          <div className="flex justify-center">
            <BrandMark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-8 text-center"
          >
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Complete Profile
            </p>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Select your role
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Pick the card that matches your role, add your mobile number, and continue to the correct dashboard.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {roles.map((role, index) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(role.id)}
                  className={`rounded-[30px] border p-6 text-left transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.12)]"
                      : "border-white/80 bg-white/72 hover:bg-white"
                  }`}
                >
                  <div className={`inline-flex rounded-2xl p-3 ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-display mt-5 text-2xl font-semibold text-slate-950">{role.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{role.desc}</p>
                </motion.button>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="mx-auto mt-10 max-w-xl"
          >
            <label htmlFor="mobile" className="mb-3 block text-sm font-semibold text-slate-700">
              Enter your mobile number
            </label>
            <input
              type="tel"
              id="mobile"
              className="w-full rounded-[24px] border border-white/80 bg-white/78 px-4 py-4 text-slate-800 outline-none focus:border-emerald-300"
              placeholder="e.g. 0000000000"
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              value={mobile}
            />
            <p className="mt-3 text-sm text-slate-500">
              Use a 10-digit mobile number so delivery updates and OTP verification work correctly.
            </p>
          </motion.div>

          {errorMessage && (
            <div className="mx-auto mt-6 max-w-xl rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {errorMessage}
            </div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            disabled={mobile.length !== 10 || !selectedRole || loading}
            className={`mx-auto mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition ${
              selectedRole && mobile.length === 10 && !loading
                ? "bg-slate-950 text-white hover:bg-emerald-700"
                : "bg-slate-200 text-slate-500"
            }`}
            onClick={() => void handleEdit()}
          >
            {loading ? "Saving profile..." : "Go to dashboard"}
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default EditRoleMobile
