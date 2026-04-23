'use client'

import DeliveryChat from './DeliveryChat'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  Loader,
  MapPin,
  MessageSquareText,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
} from 'lucide-react'

import { getSocket } from '@/lib/socket'
import { deliveryInsightMeta, DeliveryInsightMetric } from '@/lib/deliveryInsights'
import { RootState } from '@/redux/store'

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-[26px] bg-emerald-50" />,
})

interface ILocation {
  latitude: number
  longitude: number
}

interface IOrderItem {
  name: string
  quantity: number
  unit: string
  price: string
}

interface IDeliveryPartner {
  _id?: string
  name?: string
  mobile?: string
  location?: {
    coordinates?: number[]
  }
}

interface IDeliveryOrder {
  _id: string
  items: IOrderItem[]
  totalAmount: number
  status?: "pending" | "out of delivery" | "delivered"
  address: {
    fullName: string
    mobile: string
    fullAddress: string
    latitude: number
    longitude: number
  }
  deliveryOtpVerification: boolean
  deliveryOtpExpiresAt?: string | Date | null
  assignedDeliveryBoy?: IDeliveryPartner
}

interface IDeliveryAssignment {
  _id: string
  order: IDeliveryOrder
}

interface IStatusEvent {
  orderId: string
  status: IDeliveryOrder["status"]
}

interface ILocationEvent {
  userId?: string
  location?: {
    coordinates?: number[]
    latitude?: number
    longitude?: number
  }
}

interface DeliverySummary {
  todayEarning: number
  todayDeliveries: number
  weeklyDeliveries: number
  totalCompleted: number
}

const emptyLocation = { latitude: 0, longitude: 0 }
const dashboardRefreshIntervalMs = 1500

const isValidLocation = (location: ILocation) => {
  return Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    !(location.latitude === 0 && location.longitude === 0)
}

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString()}`

const formatOtpTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0")
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${remainingSeconds}`
}

const getDistanceKm = (from: ILocation, to: ILocation) => {
  if (!isValidLocation(from) || !isValidLocation(to)) return null

  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (earthRadiusKm * c).toFixed(1)
}

function DeliveryBoyDashboard({ summary }: { summary: DeliverySummary }) {
  const { userData } = useSelector((state: RootState) => state.user)
  const [assignments, setAssignments] = useState<IDeliveryAssignment[]>([])
  const [activeOrder, setActiveOrder] = useState<IDeliveryAssignment | null>(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpInfo, setOtpInfo] = useState("")
  const [debugOtp, setDebugOtp] = useState("")
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0)
  const [sendOtpLoading, setSendOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [panelError, setPanelError] = useState("")
  const [locationStatus, setLocationStatus] = useState("Detecting your live location...")
  const [userLocation, setUserLocation] = useState<ILocation>(emptyLocation)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>(emptyLocation)

  const fetchAssignments = useCallback(async () => {
    try {
      const result = await axios.get("/api/delivery/get-assignments")
      setAssignments(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.log(error)
    }
  }, [])

  const fetchCurrentOrder = useCallback(async () => {
    try {
      const result = await axios.get("/api/delivery/current-order")
      if (result.data.active) {
        const assignment = result.data.assignment as IDeliveryAssignment
        setActiveOrder(assignment)
        setUserLocation({
          latitude: assignment.order.address.latitude,
          longitude: assignment.order.address.longitude,
        })

        const coordinates = assignment.order.assignedDeliveryBoy?.location?.coordinates
        setDeliveryBoyLocation(
          coordinates?.length
            ? {
                latitude: coordinates[1] ?? 0,
                longitude: coordinates[0] ?? 0,
              }
            : emptyLocation,
        )

        const expiresAt = assignment.order.deliveryOtpExpiresAt
        if (!assignment.order.deliveryOtpVerification && expiresAt && new Date(expiresAt).getTime() > Date.now()) {
          const expiresAtIso = new Date(expiresAt).toISOString()
          setShowOtpBox(true)
          setOtpExpiresAt(expiresAtIso)
          setOtpSecondsLeft(Math.max(0, Math.ceil((new Date(expiresAtIso).getTime() - Date.now()) / 1000)))
          setOtpInfo("OTP already sent to customer email")
        }
      } else {
        setActiveOrder(null)
        setShowOtpBox(false)
        setOtp("")
        setOtpExpiresAt(null)
        setOtpInfo("")
        setDebugOtp("")
        setOtpError("")
        setUserLocation(emptyLocation)
        setDeliveryBoyLocation(emptyLocation)
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAssignments(), fetchCurrentOrder()])
  }, [fetchAssignments, fetchCurrentOrder])

  useEffect(() => {
    if (!userData?._id) return
    void refreshAll()
  }, [refreshAll, userData?._id])

  useEffect(() => {
    if (!userData?._id) return

    const interval = window.setInterval(() => {
      void refreshAll()
    }, dashboardRefreshIntervalMs)

    return () => window.clearInterval(interval)
  }, [refreshAll, userData?._id])

  useEffect(() => {
    if (!userData?._id) return
    const socket = getSocket()

    const refreshDeliveryPanel = () => {
      void refreshAll()
    }

    const handleNewAssignment = (deliveryAssignment: IDeliveryAssignment) => {
      setAssignments((prev) => {
        if (prev.some((assignment) => assignment._id === deliveryAssignment._id)) return prev
        return [deliveryAssignment, ...prev]
      })
      void fetchAssignments()
    }

    const handleDeliveryLocation = ({ userId, location }: ILocationEvent) => {
      if (userId !== userData._id) return
      if (!location) return
      setDeliveryBoyLocation({
        latitude: location.coordinates?.[1] ?? location.latitude ?? 0,
        longitude: location.coordinates?.[0] ?? location.longitude ?? 0,
      })
    }

    const handleStatusUpdate = (data: IStatusEvent) => {
      setActiveOrder((prev) => {
        if (!prev || prev.order._id !== data.orderId) return prev
        if (data.status === "delivered") return null
        return { ...prev, order: { ...prev.order, status: data.status } }
      })
      refreshDeliveryPanel()
    }

    socket.on("new-assignment", handleNewAssignment)
    socket.on("order-assigned", refreshDeliveryPanel)
    socket.on("assignment-updated", refreshDeliveryPanel)
    socket.on("order-status-update", handleStatusUpdate)
    socket.on("update-deliveryBoy-location", handleDeliveryLocation)

    return () => {
      socket.off("new-assignment", handleNewAssignment)
      socket.off("order-assigned", refreshDeliveryPanel)
      socket.off("assignment-updated", refreshDeliveryPanel)
      socket.off("order-status-update", handleStatusUpdate)
      socket.off("update-deliveryBoy-location", handleDeliveryLocation)
    }
  }, [fetchAssignments, refreshAll, userData?._id])

  useEffect(() => {
    const socket = getSocket()
    if (!userData?._id) return
    if (!navigator.geolocation) {
      setLocationStatus("Browser location is not supported")
      return
    }

    setLocationStatus("Detecting your live location...")

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const latitude = pos.coords.latitude
        const longitude = pos.coords.longitude
        setDeliveryBoyLocation({ latitude, longitude })
        setLocationStatus("Live location is on")
        socket.emit("update-location", {
          userId: userData._id,
          latitude,
          longitude,
        })
      },
      (err) => {
        console.log(err)
        setLocationStatus("Allow location permission to show your live position")
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [userData?._id])

  useEffect(() => {
    if (!otpExpiresAt) return

    const timer = window.setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - Date.now()) / 1000))
      setOtpSecondsLeft(secondsLeft)
      if (secondsLeft === 0) {
        setOtpInfo("OTP expired. Please resend OTP.")
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [otpExpiresAt])

  const handleAccept = async (id: string) => {
    setActionLoading(id)
    setPanelError("")
    try {
      await axios.get(`/api/delivery/assignment/${id}/accept-assignment`)
      setAssignments((prev) => prev.filter((assignment) => assignment._id !== id))
      await fetchCurrentOrder()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPanelError(error.response?.data?.message || "Unable to accept assignment")
      } else {
        setPanelError("Unable to accept assignment")
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    setPanelError("")
    try {
      await axios.post(`/api/delivery/assignment/${id}/reject-assignment`)
      setAssignments((prev) => prev.filter((assignment) => assignment._id !== id))
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPanelError(error.response?.data?.message || "Unable to reject assignment")
      } else {
        setPanelError("Unable to reject assignment")
      }
    } finally {
      setActionLoading(null)
    }
  }

  const sendOtp = async () => {
    if (!activeOrder) return
    setSendOtpLoading(true)
    setOtpError("")
    setOtpInfo("")
    try {
      const result = await axios.post("/api/delivery/otp/send", { orderId: activeOrder.order._id })
      setShowOtpBox(true)
      setOtp("")
      setOtpExpiresAt(result.data.expiresAt || null)
      setOtpSecondsLeft(Number(result.data.expiresInSeconds) || 120)
      setOtpInfo(result.data.message || "OTP sent to customer email")
      setDebugOtp(result.data.debugOtp || "")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setOtpError(error.response?.data?.message || "Unable to send OTP")
      } else {
        setOtpError("Unable to send OTP")
      }
    } finally {
      setSendOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!activeOrder) return
    setVerifyOtpLoading(true)
    setOtpError("")
    try {
      await axios.post("/api/delivery/otp/verify", { orderId: activeOrder.order._id, otp })
      setOtp("")
      setShowOtpBox(false)
      setOtpInfo("")
      setDebugOtp("")
      setOtpExpiresAt(null)
      setOtpSecondsLeft(0)
      setActiveOrder(null)
      await refreshAll()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "OTP verification failed"
        setOtpError(message)
        if (message.toLowerCase().includes("expired")) {
          setOtpSecondsLeft(0)
        }
      } else {
        setOtpError("OTP verification failed")
      }
    } finally {
      setVerifyOtpLoading(false)
    }
  }

  const travelDistance = activeOrder
    ? getDistanceKm(deliveryBoyLocation, {
        latitude: activeOrder.order.address.latitude,
        longitude: activeOrder.order.address.longitude,
      })
    : null

  const performanceData = useMemo(
    () => [
      { label: "Today", deliveries: summary.todayDeliveries },
      { label: "Week", deliveries: summary.weeklyDeliveries },
      { label: "Queue", deliveries: assignments.length + (activeOrder ? 1 : 0) },
    ],
    [activeOrder, assignments.length, summary.todayDeliveries, summary.weeklyDeliveries],
  )

  const summaryCards = [
    {
      metric: "today-earning" as DeliveryInsightMetric,
      label: "Today Earning",
      value: formatCurrency(summary.todayEarning),
      icon: IndianRupee,
      tone: "bg-emerald-100 text-emerald-800",
    },
    {
      metric: "today-deliveries" as DeliveryInsightMetric,
      label: "Today Deliveries",
      value: `${summary.todayDeliveries}`,
      icon: CheckCircle2,
      tone: "bg-sky-100 text-sky-800",
    },
    {
      metric: "weekly-completed" as DeliveryInsightMetric,
      label: "Weekly Completed",
      value: `${summary.weeklyDeliveries}`,
      icon: Truck,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      metric: "total-completed" as DeliveryInsightMetric,
      label: "Total Completed",
      value: `${summary.totalCompleted}`,
      icon: ShieldCheck,
      tone: "bg-slate-900 text-white",
    },
  ]

  return (
    <div className="min-h-screen pb-16 pt-32">
      <div className="mx-auto flex w-[94%] max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Delivery Dashboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Quick Basket rider control center
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Accept nearby orders, stay route-aware, coordinate with customers, and close deliveries with secure OTP verification.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            onClick={() => void refreshAll()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh panel
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {summaryCards.map(({ metric, label, value, icon: Icon, tone }) => (
            <Link
              key={label}
              href={`/delivery/insights/${metric}`}
              className="glass-panel group rounded-[28px] p-5 transition hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`inline-flex rounded-2xl px-3 py-3 ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition group-hover:text-emerald-700">
                  Details
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {deliveryInsightMeta[metric].description}
              </p>
            </Link>
          ))}
        </div>

        {panelError && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {panelError}
          </div>
        )}

        {!activeOrder && assignments.length === 0 && (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
                    Performance
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
                    You are ready for the next assignment
                  </h2>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  Status: Standby
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <p className="text-sm text-white/65">Today total</p>
                  <p className="mt-2 text-4xl font-bold">{formatCurrency(summary.todayEarning)}</p>
                  <p className="mt-4 text-sm leading-7 text-white/70">
                    Stay online and keep location access on so Quick Basket can send you the next closest order.
                  </p>
                  <div className="mt-6 grid gap-3">
                    {[
                      "Location updates remain active",
                      "Customer OTP closes the delivery safely",
                      "Chat is ready whenever a new order is accepted",
                    ].map((item) => (
                      <div key={item} className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/72 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Delivery trend</p>
                      <p className="font-display text-2xl font-semibold text-slate-950">Recent activity</p>
                    </div>
                    <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Auto-updating
                    </div>
                  </div>

                  <div className="mt-6 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="deliveryChart" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#dbe4e8" />
                        <XAxis dataKey="label" stroke="#64748b" />
                        <Tooltip />
                        <Area type="monotone" dataKey="deliveries" stroke="#10b981" strokeWidth={3} fill="url(#deliveryChart)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel-dark rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Bike className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <p className="text-sm text-white/65">Assignment queue</p>
                  <h2 className="font-display text-3xl font-semibold text-white">No active deliveries</h2>
                </div>
              </div>

              <p className="mt-5 text-base leading-7 text-white/70">
                Stay on this dashboard. As soon as an order is broadcast to you, it will appear here and you can accept it instantly.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  { title: "Live location", text: locationStatus },
                  { title: "Incoming queue", text: "Assignments will appear here automatically." },
                  { title: "Delivery closure", text: "Customer OTP keeps every order handoff verified." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <p className="text-sm text-white/60">{item.title}</p>
                    <p className="mt-2 font-medium text-white">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!activeOrder && assignments.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="glass-panel-strong rounded-[30px] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Incoming assignment
                      </div>
                      <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                        Order #{assignment.order._id.slice(-6)}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Accept to open live route, customer chat, and OTP verification flow.
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-slate-950 px-4 py-3 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/55">Order amount</p>
                      <p className="mt-1 text-2xl font-bold">{formatCurrency(assignment.order.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <UserCheck className="h-4 w-4 text-emerald-700" />
                        {assignment.order.address.fullName}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-emerald-700" />
                        {assignment.order.address.mobile}
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                        <span>{assignment.order.address.fullAddress}</span>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Package className="h-4 w-4 text-emerald-700" />
                        {assignment.order.items.length} items in this order
                      </div>
                      <div className="mt-4 grid gap-2">
                        {assignment.order.items.slice(0, 3).map((item, index) => (
                          <div key={`${item.name}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {item.quantity} x {item.name} ({item.unit})
                          </div>
                        ))}
                        {assignment.order.items.length > 3 && (
                          <div className="text-sm font-medium text-slate-500">
                            +{assignment.order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      disabled={actionLoading === assignment._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => void handleAccept(assignment._id)}
                    >
                      {actionLoading === assignment._id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Accept assignment
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <button
                      disabled={actionLoading === assignment._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      onClick={() => void handleReject(assignment._id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel-dark rounded-[32px] p-6 sm:p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                Queue Tips
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                Move fast, but keep the handoff clean
              </h2>

              <div className="mt-7 grid gap-3">
                {[
                  "Accept the closest order first whenever possible.",
                  "Keep location enabled so the customer sees accurate movement.",
                  "Use chat before calling if the address needs a quick confirmation.",
                  "Always verify OTP only after the customer has received the order.",
                ].map((item, index) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/8 p-4 text-white/80">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Step 0{index + 1}</p>
                    <p className="mt-2 text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeOrder && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Active delivery
                    </div>
                    <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
                      Order #{activeOrder.order._id.slice(-6)}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      Customer details, live route visibility, and handoff controls are all connected below.
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Current amount</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(activeOrder.order.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-white/80 bg-white/70 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserCheck className="h-4 w-4 text-emerald-700" />
                      Customer
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{activeOrder.order.address.fullName}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-emerald-700" />
                      {activeOrder.order.address.mobile}
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                      <span>{activeOrder.order.address.fullAddress}</span>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/70 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Items</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">{activeOrder.order.items.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Distance</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">{travelDistance ? `${travelDistance} km` : "Live"}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                      {locationStatus}
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.order.address.latitude},${activeOrder.order.address.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Navigation className="h-4 w-4" />
                      Open route in Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-panel-strong rounded-[32px] p-3 sm:p-4">
                <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
              </div>

              <div className="glass-panel-strong rounded-[32px] p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold text-slate-950">Customer chat</p>
                    <p className="text-sm text-slate-600">Use quick replies or send a direct update.</p>
                  </div>
                </div>
                <DeliveryChat orderId={activeOrder.order._id} deliveryBoyId={userData?._id?.toString() || ""} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-panel-dark rounded-[32px] p-6 sm:p-7">
                <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                  Order Checklist
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                  Keep the handoff reliable
                </h2>

                <div className="mt-7 grid gap-3">
                  {[
                    { title: "Reach customer location", status: isValidLocation(deliveryBoyLocation) ? "Live route active" : "Waiting for GPS" },
                    { title: "Coordinate arrival", status: "Use chat or call for quick confirmation" },
                    { title: "Complete with OTP", status: activeOrder.order.deliveryOtpVerification ? "Verified" : "Pending" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                      <p className="text-sm text-white/55">{item.title}</p>
                      <p className="mt-2 font-medium text-white">{item.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Order items</p>
                    <p className="font-display text-2xl font-semibold text-slate-950">Delivery summary</p>
                  </div>
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {activeOrder.order.status || "pending"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {activeOrder.order.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-[22px] border border-white/80 bg-white/68 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.quantity} x {item.unit}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-700">Rs. {Number(item.price) * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold text-slate-950">OTP handoff</p>
                    <p className="text-sm text-slate-600">Send OTP only when the order reaches the customer.</p>
                  </div>
                </div>

                {!activeOrder.order.deliveryOtpVerification && !showOtpBox && (
                  <div className="mt-6">
                    <button
                      onClick={() => void sendOtp()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      {sendOtpLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Send delivery OTP"}
                    </button>

                    {otpError && (
                      <div className="mt-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {otpError}
                      </div>
                    )}
                  </div>
                )}

                {showOtpBox && (
                  <div className="mt-6">
                    {otpInfo && (
                      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        {otpInfo}
                      </div>
                    )}

                    <div
                      className={`mt-4 rounded-[22px] border px-4 py-3 text-sm font-semibold ${
                        otpSecondsLeft > 0
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {otpSecondsLeft > 0
                        ? `OTP expires in ${formatOtpTime(otpSecondsLeft)}`
                        : "OTP expired. Resend OTP to customer email."}
                    </div>

                    {debugOtp && (
                      <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        Dev OTP: {debugOtp}
                      </div>
                    )}

                    <input
                      type="text"
                      className="mt-4 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-center text-lg tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-300"
                      placeholder="0000"
                      maxLength={4}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      value={otp}
                    />

                    <button
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => void verifyOtp()}
                      disabled={verifyOtpLoading || otp.trim().length !== 4 || otpSecondsLeft === 0}
                    >
                      {verifyOtpLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Verify OTP"}
                    </button>

                    <button
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                      onClick={() => void sendOtp()}
                      disabled={sendOtpLoading}
                    >
                      {sendOtpLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Resend OTP"}
                    </button>

                    {otpError && <div className="mt-3 text-sm font-semibold text-red-600">{otpError}</div>}
                  </div>
                )}

                {activeOrder.order.deliveryOtpVerification && (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center font-semibold text-emerald-800">
                    <CheckCircle2 className="h-5 w-5" />
                    Delivery completed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryBoyDashboard
