'use client'

import {
  CheckCircle2,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  ShoppingCartIcon,
  Truck,
  User,
  X,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { useRouter } from 'next/navigation'

import { getDashboardPath } from '@/lib/appRoutes'
import BrandMark from './BrandMark'

interface IUser {
  _id?: string
  name: string
  email: string
  password?: string
  mobile?: string
  role: "user" | "deliveryBoy" | "admin"
  image?: string
}

const adminLinks = [
  { href: "/admin/groceries/add", label: "Add Grocery", icon: PlusCircle },
  { href: "/admin/groceries", label: "View Grocery", icon: Boxes },
  { href: "/admin/orders", label: "Manage Orders", icon: ClipboardCheck },
]

const roleTheme = {
  user: {
    label: "Customer Mode",
    icon: ShoppingCartIcon,
    classes: "bg-emerald-100 text-emerald-800",
  },
  deliveryBoy: {
    label: "Delivery Hub",
    icon: Truck,
    classes: "bg-amber-100 text-amber-800",
  },
  admin: {
    label: "Operations",
    icon: ShieldCheck,
    classes: "bg-slate-900 text-white",
  },
} as const

function Nav({ user }: { user: IUser }) {
  const [open, setOpen] = useState(false)
  const profileDropDown = useRef<HTMLDivElement>(null)
  const [searchBarOpen, setSearchBarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [logoutState, setLogoutState] = useState<"confirm" | "processing" | "success">("confirm")
  const { cartData } = useSelector((state: RootState) => state.cart)
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const query = search.trim()
    if (!query) {
      router.push(dashboardPath)
      return
    }

    router.push(`/user/dashboard?q=${encodeURIComponent(query)}`)
    setSearch("")
    setSearchBarOpen(false)
  }

  const roleConfig = roleTheme[user.role]
  const RoleIcon = roleConfig.icon
  const dashboardPath = getDashboardPath(user.role)

  const openLogoutModal = () => {
    setOpen(false)
    setMenuOpen(false)
    setLogoutState("confirm")
    setLogoutModalOpen(true)
  }

  const closeLogoutModal = () => {
    if (logoutState === "processing") return
    setLogoutModalOpen(false)
    setTimeout(() => setLogoutState("confirm"), 180)
  }

  const handleConfirmLogout = async () => {
    setLogoutState("processing")

    try {
      const result = await signOut({
        redirect: false,
        callbackUrl: "/",
      })

      setLogoutState("success")

      window.setTimeout(() => {
        router.replace(result?.url || "/")
        router.refresh()
      }, 950)
    } catch (error) {
      console.log(error)
      setLogoutState("confirm")
      setLogoutModalOpen(false)
    }
  }

  const sideBar = menuOpen
    ? createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ x: -72, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -72, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="glass-panel-dark fixed inset-y-4 left-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col rounded-[30px] p-5 text-white"
          >
            <div className="mb-6 flex items-center justify-between">
              <BrandMark href={dashboardPath} light compact />
              <button
                className="rounded-full border border-white/10 bg-white/10 p-2 text-white/80 transition hover:bg-white/16 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/12">
                  {user.image ? (
                    <Image src={user.image} alt="user" fill className="object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{user.name}</h2>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/14"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              className="mt-auto flex items-center justify-center gap-2 rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-500/18"
              onClick={openLogoutModal}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 w-[95%] max-w-7xl -translate-x-1/2">
        <div className="glass-panel-strong flex min-h-20 items-center justify-between gap-3 rounded-[32px] px-4 py-3 sm:px-5 lg:px-7">
          <div className="flex items-center gap-3">
            <BrandMark href={dashboardPath} compact={user.role === "user" ? false : true} />
            <div className={`hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold lg:inline-flex ${roleConfig.classes}`}>
              <RoleIcon className="h-3.5 w-3.5" />
              {roleConfig.label}
            </div>
          </div>

          {user.role === "user" && (
            <form
              className="hidden flex-1 items-center rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-sm md:flex md:max-w-xl"
              onSubmit={handleSearch}
            >
              <Search className="mr-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search groceries, categories, or essentials..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          )}

          <div className="flex items-center gap-3">
            {user.role === "user" && (
              <>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white md:hidden"
                  onClick={() => setSearchBarOpen((prev) => !prev)}
                >
                  <Search className="h-5 w-5" />
                </button>

                <Link
                  href="/user/cart"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-700 shadow-sm transition hover:scale-[1.03] hover:bg-white"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                    {cartData.length}
                  </span>
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  {adminLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-emerald-800"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white lg:hidden"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            )}

            {user.role === "deliveryBoy" && (
              <div className="hidden items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 sm:inline-flex">
                <Truck className="h-4 w-4" />
                Stay online for new assignments
              </div>
            )}

            <div className="relative" ref={profileDropDown}>
              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/70 shadow-sm transition hover:scale-[1.03] hover:bg-white"
                onClick={() => setOpen((prev) => !prev)}
              >
                {user.image ? (
                  <Image src={user.image} alt="user" fill className="object-cover" />
                ) : (
                  <User className="h-5 w-5 text-slate-700" />
                )}
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="glass-panel-strong absolute right-0 mt-3 w-72 rounded-[26px] p-4"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-200/70 pb-4">
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
                        {user.image ? (
                          <Image src={user.image} alt="user" fill className="object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-slate-700" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/80 hover:text-emerald-800"
                        onClick={() => setOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>

                      {user.role === "user" && (
                        <Link
                          href="/user/orders"
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/80 hover:text-emerald-800"
                          onClick={() => setOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                      )}

                      <button
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                        onClick={openLogoutModal}
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {searchBarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="glass-panel-strong fixed left-1/2 top-24 flex w-[92%] max-w-xl -translate-x-1/2 items-center rounded-full px-4 py-3 md:hidden"
                  >
                    <Search className="mr-3 h-5 w-5 text-slate-400" />
                    <form className="grow" onSubmit={handleSearch}>
                      <input
                        type="text"
                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="Search groceries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </form>
                    <button type="button" onClick={() => setSearchBarOpen(false)}>
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {logoutModalOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="glass-panel-strong w-full max-w-md rounded-[32px] p-6 sm:p-7"
              >
                {logoutState === "confirm" && (
                  <div>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-100 text-red-600">
                      <TriangleAlert className="h-8 w-8" />
                    </div>
                    <div className="mt-5 text-center">
                      <p className="font-display text-3xl font-bold tracking-tight text-slate-950">
                        Are you sure?
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                        You will be logged out from Quick Basket and taken back to the main landing page.
                      </p>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={closeLogoutModal}
                      >
                        No, stay here
                      </button>
                      <button
                        type="button"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
                        onClick={() => void handleConfirmLogout()}
                      >
                        <LogOut className="h-4 w-4" />
                        Yes, logout
                      </button>
                    </div>
                  </div>
                )}

                {logoutState === "processing" && (
                  <div className="py-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-amber-100 text-amber-700">
                      <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                    <p className="font-display mt-5 text-3xl font-bold tracking-tight text-slate-950">
                      Logging you out
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                      Please wait while we securely close your session.
                    </p>
                  </div>
                )}

                {logoutState === "success" && (
                  <div className="py-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="font-display mt-5 text-3xl font-bold tracking-tight text-slate-950">
                      Logged out successfully
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                      Redirecting you to the Quick Basket landing page.
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
      {sideBar}
    </>
  )
}

export default Nav
