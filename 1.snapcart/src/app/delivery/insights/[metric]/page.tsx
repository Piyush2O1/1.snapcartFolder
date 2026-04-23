import { redirect, notFound } from 'next/navigation'

import { auth } from '@/auth'
import DeliveryInsightDetails from '@/components/DeliveryInsightDetails'
import connectDb from '@/lib/db'
import { DELIVERY_EARNING_PER_ORDER, isDeliveryInsightMetric } from '@/lib/deliveryInsights'
import Order from '@/models/order.model'

interface PopulatedUser {
  name?: string
  email?: string
  mobile?: string
}

interface PopulatedDeliveryBoy {
  name?: string
  mobile?: string
  isOnline?: boolean
  location?: {
    coordinates?: number[]
  }
}

interface RawInsightOrder {
  _id: unknown
  totalAmount?: number
  paymentMethod: "cod" | "online"
  status?: "pending" | "out of delivery" | "delivered"
  deliveredAt?: Date | string | null
  createdAt?: Date | string | null
  address?: {
    fullName?: string
    mobile?: string
    fullAddress?: string
    city?: string
    state?: string
    pincode?: string
    latitude?: number
    longitude?: number
  }
  items?: {
    name: string
    quantity?: number
    unit: string
    price: string
  }[]
  user?: PopulatedUser
  assignedDeliveryBoy?: PopulatedDeliveryBoy
}

const isSameDay = (date: Date, compareTo: Date) =>
  date.getFullYear() === compareTo.getFullYear() &&
  date.getMonth() === compareTo.getMonth() &&
  date.getDate() === compareTo.getDate()

export default async function DeliveryInsightPage(props: {
  params: Promise<{
    metric: string
  }>
}) {
  const { metric } = await props.params

  if (!isDeliveryInsightMetric(metric)) {
    notFound()
  }

  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  await connectDb()

  const deliveryBoyId = session.user.id
  const orders = await Order.find({
    assignedDeliveryBoy: deliveryBoyId,
    deliveryOtpVerification: true,
  })
    .populate<{ user: PopulatedUser }>("user", "name email mobile")
    .populate<{ assignedDeliveryBoy: PopulatedDeliveryBoy }>("assignedDeliveryBoy", "name mobile isOnline location")
    .sort({ deliveredAt: -1, createdAt: -1 })
    .lean() as unknown as RawInsightOrder[]

  const now = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const filteredOrders = orders.filter((order) => {
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null
    if (!deliveredAt) return false

    if (metric === "today-earning" || metric === "today-deliveries") {
      return isSameDay(deliveredAt, now)
    }

    if (metric === "weekly-completed") {
      return deliveredAt >= sevenDaysAgo
    }

    return true
  })

  const serializedOrders = filteredOrders.map((order) => ({
    _id: String(order._id),
    totalAmount: Number(order.totalAmount || 0),
    paymentMethod: order.paymentMethod,
    status: order.status,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
    earning: DELIVERY_EARNING_PER_ORDER,
    address: {
      fullName: order.address?.fullName || order.user?.name || "Customer",
      mobile: order.address?.mobile || order.user?.mobile || "",
      fullAddress: order.address?.fullAddress || "",
      city: order.address?.city || "",
      state: order.address?.state || "",
      pincode: order.address?.pincode || "",
      latitude: Number(order.address?.latitude || 0),
      longitude: Number(order.address?.longitude || 0),
    },
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity || 0),
          unit: item.unit,
          price: item.price,
        }))
      : [],
    customer: {
      name: order.user?.name || "",
      email: order.user?.email || "",
      mobile: order.user?.mobile || "",
    },
    assignedDeliveryBoy: order.assignedDeliveryBoy
      ? {
          name: order.assignedDeliveryBoy.name || "",
          mobile: order.assignedDeliveryBoy.mobile || "",
          isOnline: Boolean(order.assignedDeliveryBoy.isOnline),
          location: order.assignedDeliveryBoy.location
            ? {
                coordinates: order.assignedDeliveryBoy.location.coordinates || [],
              }
            : undefined,
        }
      : undefined,
  }))

  return <DeliveryInsightDetails metric={metric} orders={serializedOrders} />
}
