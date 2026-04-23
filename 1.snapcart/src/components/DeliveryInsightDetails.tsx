'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  Phone,
  Route,
  ShieldCheck,
  Truck,
  UserCheck,
} from 'lucide-react'

import { DELIVERY_EARNING_PER_ORDER, DeliveryInsightMetric, deliveryInsightMeta } from '@/lib/deliveryInsights'

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-[26px] bg-emerald-50" />,
})

type InsightOrder = {
  _id: string
  totalAmount: number
  paymentMethod: "cod" | "online"
  status?: "pending" | "out of delivery" | "delivered"
  deliveredAt?: string | null
  createdAt?: string | null
  earning: number
  address: {
    fullName: string
    mobile: string
    fullAddress: string
    city?: string
    state?: string
    pincode?: string
    latitude: number
    longitude: number
  }
  items: {
    name: string
    quantity: number
    unit: string
    price: string
  }[]
  customer?: {
    name?: string
    email?: string
    mobile?: string
  }
  assignedDeliveryBoy?: {
    name?: string
    mobile?: string
    isOnline?: boolean
    location?: {
      coordinates?: number[]
    }
  }
}

type DeliveryInsightDetailsProps = {
  metric: DeliveryInsightMetric
  orders: InsightOrder[]
}

type LocationShape = {
  latitude: number
  longitude: number
}

const emptyLocation = { latitude: 0, longitude: 0 }

const isValidLocation = (location?: LocationShape) => {
  if (!location) return false
  return Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    !(location.latitude === 0 && location.longitude === 0)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available"
  return new Date(value).toLocaleString()
}

function DeliveryInsightDetails({ metric, orders }: DeliveryInsightDetailsProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?._id ?? "")
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<LocationShape>(emptyLocation)
  const [locationStatus, setLocationStatus] = useState("Checking your live location...")

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId],
  )

  const userLocation = selectedOrder
    ? {
        latitude: selectedOrder.address.latitude,
        longitude: selectedOrder.address.longitude,
      }
    : emptyLocation

  useEffect(() => {
    if (!selectedOrder) return

    const coordinates = selectedOrder.assignedDeliveryBoy?.location?.coordinates
    if (coordinates?.length) {
      setDeliveryBoyLocation({
        latitude: coordinates[1] ?? 0,
        longitude: coordinates[0] ?? 0,
      })
      setLocationStatus("Using your latest saved location")
    }
  }, [selectedOrder])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Browser location is not supported")
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setDeliveryBoyLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setLocationStatus("Your live location is active")
      },
      () => {
        setLocationStatus("Enable location permission to show your current position")
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalEarning = orders.reduce((sum, order) => sum + order.earning, 0)
  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0)

  const topStats = [
    {
      label: "Orders in this view",
      value: `${orders.length}`,
      icon: Truck,
    },
    {
      label: "Total order value",
      value: `Rs. ${totalAmount.toLocaleString()}`,
      icon: Package,
    },
    {
      label: metric === "today-earning" ? "Estimated earning" : "Earning covered",
      value: `Rs. ${totalEarning.toLocaleString()}`,
      icon: IndianRupee,
    },
    {
      label: "Tracked item lines",
      value: `${totalItems}`,
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen pb-16 pt-32">
      <div className="mx-auto flex w-[94%] max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Delivery Insights
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {deliveryInsightMeta[metric].label}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {deliveryInsightMeta[metric].description}
            </p>
          </div>

          <Link
            href="/delivery/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to delivery dashboard
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {topStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-panel rounded-[28px] p-5">
              <div className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="glass-panel-strong rounded-[32px] p-10 text-center">
            <p className="font-display text-3xl font-bold text-slate-950">No deliveries found</p>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              There is no completed delivery data for this metric yet. Once orders are completed, detailed location and customer breakdown will show here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              {orders.map((order) => {
                const isSelected = selectedOrder?._id === order._id
                return (
                  <button
                    key={order._id}
                    type="button"
                    onClick={() => setSelectedOrderId(order._id)}
                    className={`w-full rounded-[30px] border p-5 text-left transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.12)]"
                        : "glass-panel hover:bg-white/90"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          Order #{order._id.slice(-6)}
                        </div>
                        <p className="mt-3 text-lg font-semibold text-slate-950">{order.address.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(order.deliveredAt || order.createdAt)}</p>
                      </div>
                      <div className="rounded-[24px] bg-white/85 px-4 py-3 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Earning</p>
                        <p className="mt-1 text-2xl font-bold text-slate-950">Rs. {order.earning}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] bg-white/75 px-4 py-3">
                        <p className="text-sm text-slate-500">Order value</p>
                        <p className="mt-1 font-semibold text-slate-900">Rs. {order.totalAmount}</p>
                      </div>
                      <div className="rounded-[22px] bg-white/75 px-4 py-3">
                        <p className="text-sm text-slate-500">Customer location</p>
                        <p className="mt-1 line-clamp-2 font-semibold text-slate-900">{order.address.fullAddress}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
                        Selected Delivery
                      </p>
                      <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950">
                        Order #{selectedOrder._id.slice(-6)}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Customer address, order lines, and mapped destination are all shown here.
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/55">Per delivery earning</p>
                      <p className="mt-2 text-3xl font-bold">Rs. {selectedOrder.earning || DELIVERY_EARNING_PER_ORDER}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-white/80 bg-white/72 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <UserCheck className="h-4 w-4 text-emerald-700" />
                        Customer detail
                      </div>
                      <p className="mt-3 text-2xl font-bold text-slate-950">{selectedOrder.address.fullName}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-emerald-700" />
                        {selectedOrder.address.mobile}
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
                        <span>{selectedOrder.address.fullAddress}</span>
                      </div>
                      {(selectedOrder.address.city || selectedOrder.address.state || selectedOrder.address.pincode) && (
                        <p className="mt-3 text-sm text-slate-500">
                          {[selectedOrder.address.city, selectedOrder.address.state, selectedOrder.address.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-white/80 bg-white/72 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-slate-500">Completed at</p>
                          <p className="mt-2 font-semibold text-slate-950">{formatDateTime(selectedOrder.deliveredAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Payment mode</p>
                          <p className="mt-2 font-semibold capitalize text-slate-950">{selectedOrder.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Order total</p>
                          <p className="mt-2 font-semibold text-slate-950">Rs. {selectedOrder.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Items</p>
                          <p className="mt-2 font-semibold text-slate-950">{selectedOrder.items.length}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[22px] bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                        {locationStatus}
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.address.latitude},${selectedOrder.address.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Navigation className="h-4 w-4" />
                        Open customer route
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="glass-panel-strong rounded-[32px] p-3 sm:p-4">
                  <LiveMap
                    userLocation={userLocation}
                    deliveryBoyLocation={isValidLocation(deliveryBoyLocation) ? deliveryBoyLocation : emptyLocation}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="glass-panel-dark rounded-[32px] p-6 sm:p-7">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-300">
                      Map Context
                    </p>
                    <h3 className="mt-3 font-display text-3xl font-semibold text-white">
                      Customer and rider location
                    </h3>

                    <div className="mt-6 grid gap-3">
                      <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/55">Customer marker</p>
                        <p className="mt-2 text-sm leading-7 text-white/80">
                          {selectedOrder.address.latitude.toFixed(5)}, {selectedOrder.address.longitude.toFixed(5)}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/55">Your marker</p>
                        <p className="mt-2 text-sm leading-7 text-white/80">
                          {isValidLocation(deliveryBoyLocation)
                            ? `${deliveryBoyLocation.latitude.toFixed(5)}, ${deliveryBoyLocation.longitude.toFixed(5)}`
                            : "Waiting for current delivery-partner location"}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/55">What this view means</p>
                        <p className="mt-2 text-sm leading-7 text-white/80">
                          The map highlights the selected customer address and your current delivery location so you can review destination context in detail.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel-strong rounded-[32px] p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <Route className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-2xl font-semibold text-slate-950">Order breakdown</p>
                        <p className="text-sm text-slate-600">Every item delivered in this order.</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="rounded-[22px] border border-white/80 bg-white/72 px-4 py-4">
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryInsightDetails
