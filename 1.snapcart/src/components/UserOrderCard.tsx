'use client'

import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ChevronDown, ChevronUp, Clock, CreditCard, MapPin, Package, Truck, UserCheck } from 'lucide-react'
import Image from 'next/image'
import { getSocket } from '@/lib/socket'
import { useRouter } from 'next/navigation'

interface IDeliveryPartner {
  _id?: string
  name: string
  email?: string
  mobile?: string
  image?: string
}

interface IOrder {
  _id?: string
  user: string
  items: {
    grocery: string
    name: string
    price: string
    unit: string
    image: string
    quantity: number
  }[]
  isPaid: boolean
  totalAmount: number
  paymentMethod: "cod" | "online"
  address: {
    fullName: string
    mobile: string
    city: string
    state: string
    pincode: string
    fullAddress: string
    latitude: number
    longitude: number
  }
  assignment?: string
  assignedDeliveryBoy?: IDeliveryPartner
  status: "pending" | "out of delivery" | "delivered"
  createdAt?: Date
  updatedAt?: Date
}

interface IStatusEvent {
  orderId: string
  status: IOrder["status"]
}

interface IAssignedEvent {
  orderId: string
  assignedDeliveryBoy: IDeliveryPartner
}

function UserOrderCard({ order }: { order: IOrder }) {
  const [expanded, setExpanded] = useState(false)
  const [liveStatus, setLiveStatus] = useState<IOrder["status"] | null>(null)
  const [liveDeliveryPartner, setLiveDeliveryPartner] = useState<IDeliveryPartner | null>(null)
  const router = useRouter()
  const orderId = order._id?.toString() || ""
  const status = liveStatus ?? order.status
  const deliveryPartner = liveDeliveryPartner ?? order.assignedDeliveryBoy

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "out of delivery":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "delivered":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  useEffect(() => {
    if (!orderId) return

    const socket = getSocket()

    const handleStatusUpdate = (data: IStatusEvent) => {
      if (data.orderId.toString() === orderId) {
        setLiveStatus(data.status)
      }
    }

    const handleOrderAssigned = (data: IAssignedEvent) => {
      if (data.orderId.toString() === orderId) {
        setLiveDeliveryPartner(data.assignedDeliveryBoy)
        setLiveStatus("out of delivery")
      }
    }

    socket.on("order-status-update", handleStatusUpdate)
    socket.on("order-assigned", handleOrderAssigned)

    return () => {
      socket.off("order-status-update", handleStatusUpdate)
      socket.off("order-assigned", handleOrderAssigned)
    }
  }, [orderId])

  const showTrackButton = Boolean(deliveryPartner && status !== "delivered" && orderId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden'
    >
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 px-5 py-4 bg-linear-to-r from-green-50 to-white'>
        <div>
          <h3 className='text-lg font-semibold text-gray-800'>Order <span className='text-green-700 font-bold'>#{orderId.slice(-6)}</span></h3>
          <p className='text-xs text-gray-500 mt-1'>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${order.isPaid || status === "delivered"
            ? "bg-green-100 text-green-700 border-green-300"
            : "bg-red-100 text-red-700 border-red-300"
          }`}>
            {order.isPaid || status === "delivered" ? "Paid" : "Unpaid"}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold border rounded-full capitalize ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className='p-5 space-y-4'>
        <div className='flex items-center gap-2 text-gray-700 text-sm'>
          {order.paymentMethod === "cod" ? <Truck size={16} className='text-green-600' /> : <CreditCard size={16} className='text-green-600' />}
          {order.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"}
        </div>

        {deliveryPartner ? (
          <div className={`border rounded-xl p-4 ${status === "delivered" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center gap-3 text-sm text-gray-700'>
                <UserCheck className={status === "delivered" ? "text-green-600" : "text-blue-600"} size={18} />
                <div className='font-semibold text-gray-800'>
                  <p>{status === "delivered" ? "Delivered by" : "Delivery partner"}: <span>{deliveryPartner.name}</span></p>
                  <p className='text-xs text-gray-600'>{deliveryPartner.mobile ? `Phone: +91 ${deliveryPartner.mobile}` : "Phone not added"}</p>
                </div>
              </div>
              {deliveryPartner.mobile && (
                <a href={`tel:${deliveryPartner.mobile}`} className='bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-center'>
                  Call
                </a>
              )}
            </div>
            {showTrackButton && (
              <button
                className='mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition'
                onClick={() => router.push(`/user/orders/track/${orderId}`)}
              >
                <Truck size={18} /> Track Your Order
              </button>
            )}
          </div>
        ) : (
          <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-sm text-yellow-800'>
            <Clock size={18} />
            <div>
              <p className='font-semibold'>Waiting for delivery partner</p>
              <p className='text-xs text-yellow-700'>Admin will assign a nearby delivery partner soon.</p>
            </div>
          </div>
        )}

        <div className='flex items-center gap-2 text-gray-700 text-sm'>
          <MapPin size={16} className="text-green-600" />
          <span className='truncate'>{order.address.fullAddress}</span>
        </div>

        <div className='border-t border-gray-200 pt-3'>
          <button
            onClick={() => setExpanded(prev => !prev)}
            className='w-full flex justify-between items-center text-sm font-medium text-gray-700 hover:text-green-700 transition'
          >
            <span className='flex items-center gap-2'>
              <Package size={16} className="text-green-600" />
              {expanded ? "Hide Order Items" : `View ${order.items.length} Items`}
            </span>
            {expanded ? <ChevronUp size={16} className="text-green-600" /> : <ChevronDown size={16} className="text-green-600" />}
          </button>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: expanded ? "auto" : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className='mt-3 space-y-3'>
              {order.items.map((item, index) => (
                <div
                  key={`${item.grocery}-${index}`}
                  className='flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 transition'
                >
                  <div className='flex items-center gap-3'>
                    <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-lg object-cover border border-gray-200" />
                    <div>
                      <p className='text-sm font-medium text-gray-800'>{item.name}</p>
                      <p className='text-xs text-gray-500'>{item.quantity} x {item.unit}</p>
                    </div>
                  </div>
                  <p className='text-sm font-semibold text-gray-800'>Rs. {Number(item.price) * item.quantity}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className='border-t pt-3 flex justify-between items-center text-sm font-semibold text-gray-800'>
          <div className='flex items-center gap-2 text-gray-700 text-sm'>
            <Truck size={16} className="text-green-600" />
            <span>Delivery: <span className='text-green-700 font-semibold capitalize'>{status}</span></span>
          </div>
          <div>
            Total: <span className='text-green-700 font-bold'>Rs. {order.totalAmount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default UserOrderCard
