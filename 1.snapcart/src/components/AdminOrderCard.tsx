'use client'

import { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ChevronDown, ChevronUp, CreditCard, MapPin, Package, Phone, Truck, User, UserCheck } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { getSocket } from '@/lib/socket'

interface IDeliveryPartner {
  _id?: string
  name: string
  email?: string
  mobile?: string
  image?: string
}

interface IDeliveryAssignment {
  _id: string
  brodcastedTo: IDeliveryPartner[]
  assignedTo?: IDeliveryPartner | null
  status: "brodcasted" | "assigned" | "completed"
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
  assignment?: string | IDeliveryAssignment
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

interface IAssignmentEvent {
  assignmentId: string
  status: IDeliveryAssignment["status"]
  brodcastedTo: IDeliveryPartner[]
}

interface IAvailableDeliveryBoy {
  id: string
  name: string
  mobile?: string
  latitude: number
  longitude: number
}

function AdminOrderCard({ order }: { order: IOrder }) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<IOrder["status"]>(order.status)
  const [liveAssignedDeliveryBoy, setLiveAssignedDeliveryBoy] = useState<IDeliveryPartner | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [availableBoys, setAvailableBoys] = useState<IAvailableDeliveryBoy[]>([])
  const [assignment, setAssignment] = useState<IDeliveryAssignment | null>(
    typeof order.assignment === "object" ? order.assignment : null
  )

  const statusOptions: IOrder["status"][] = ["pending", "out of delivery"]
  const orderId = order._id?.toString() || ""
  const propAssignment = typeof order.assignment === "object" ? order.assignment : null
  const currentAssignment = assignment ?? propAssignment
  const assignedDeliveryBoy = liveAssignedDeliveryBoy ?? order.assignedDeliveryBoy
  const isPaid = order.isPaid || status === "delivered"

  const updateStatus = async (nextStatus: IOrder["status"]) => {
    if (!orderId) return
    setErrorMessage("")
    try {
      const result = await axios.post(`/api/admin/update-order-status/${orderId}`, { status: nextStatus })
      setStatus(nextStatus)
      setAvailableBoys(result.data.availableBoys || [])
      if (result.data.order?.assignment && typeof result.data.order.assignment === "object") {
        setAssignment(result.data.order.assignment)
      }
      if (result.data.order?.assignedDeliveryBoy) {
        setLiveAssignedDeliveryBoy(result.data.order.assignedDeliveryBoy)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || "Unable to update order")
      } else {
        setErrorMessage("Unable to update order")
      }
    }
  }

  useEffect(() => {
    if (!orderId) return
    const socket = getSocket()

    const handleStatusUpdate = (data: IStatusEvent) => {
      if (data.orderId.toString() === orderId) {
        setStatus(data.status)
      }
    }

    const handleOrderAssigned = (data: IAssignedEvent) => {
      if (data.orderId.toString() === orderId) {
        setLiveAssignedDeliveryBoy(data.assignedDeliveryBoy)
        setStatus("out of delivery")
      }
    }

    const handleAssignmentUpdated = (data: IAssignmentEvent) => {
      if (data.assignmentId === currentAssignment?._id) {
        setAssignment((prev) => prev ? {
          ...prev,
          status: data.status,
          brodcastedTo: data.brodcastedTo,
        } : prev)
      }
    }

    socket.on("order-status-update", handleStatusUpdate)
    socket.on("order-assigned", handleOrderAssigned)
    socket.on("assignment-updated", handleAssignmentUpdated)

    return () => {
      socket.off("order-status-update", handleStatusUpdate)
      socket.off("order-assigned", handleOrderAssigned)
      socket.off("assignment-updated", handleAssignmentUpdated)
    }
  }, [currentAssignment?._id, orderId])

  const broadcastedBoys = currentAssignment?.status === "brodcasted" ? currentAssignment.brodcastedTo : []
  const visibleAvailableBoys = broadcastedBoys.length ? broadcastedBoys.map((boy) => ({
    id: boy._id?.toString() || boy.email || boy.name,
    name: boy.name,
    mobile: boy.mobile,
    latitude: 0,
    longitude: 0,
  })) : availableBoys

  return (
    <motion.div
      key={order._id?.toString()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white shadow-md hover:shadow-lg border border-gray-100 rounded-2xl p-6 transition-all"
    >
      <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-lg font-bold flex items-center gap-2 text-green-700'>
            <Package size={20} />
            Order #{orderId.slice(-6)}
          </p>

          {status !== "delivered" && (
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${isPaid
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-red-100 text-red-700 border-red-300"
            }`}>
              {isPaid ? "Paid" : "Unpaid"}
            </span>
          )}

          <p className='text-gray-500 text-sm'>
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
          </p>

          <div className='mt-3 space-y-1 text-gray-700 text-sm'>
            <p className='flex items-center gap-2 font-semibold'>
              <User size={16} className='text-green-600' />
              <span>{order.address.fullName}</span>
            </p>
            <p className='flex items-center gap-2 font-semibold'>
              <Phone size={16} className='text-green-600' />
              <span>{order.address.mobile}</span>
            </p>
            <p className='flex items-center gap-2 font-semibold'>
              <MapPin size={16} className='text-green-600' />
              <span>{order.address.fullAddress}</span>
            </p>
          </div>

          <p className='mt-3 flex items-center gap-2 text-sm text-gray-700'>
            <CreditCard size={16} className='text-green-600' />
            <span>{order.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"}</span>
          </p>

          {assignedDeliveryBoy && (
            <div className='mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3 text-sm text-gray-700'>
                <UserCheck className="text-blue-600" size={18} />
                <div className='font-semibold text-gray-800'>
                  <p>Assigned to: <span>{assignedDeliveryBoy.name}</span></p>
                  <p className='text-xs text-gray-600'>{assignedDeliveryBoy.mobile ? `+91 ${assignedDeliveryBoy.mobile}` : "Mobile not added"}</p>
                </div>
              </div>

              {assignedDeliveryBoy.mobile && (
                <a href={`tel:${assignedDeliveryBoy.mobile}`} className='bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition'>Call</a>
              )}
            </div>
          )}

          {!assignedDeliveryBoy && currentAssignment?.status === "brodcasted" && (
            <div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
              <div className='flex items-center justify-between gap-3'>
                <p className='font-semibold text-yellow-800'>Waiting for delivery partner</p>
                <span className='text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full'>
                  {visibleAvailableBoys.length} available
                </span>
              </div>
              <div className='mt-3 grid gap-2'>
                {visibleAvailableBoys.map((boy) => (
                  <div key={boy.id} className='flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-yellow-100'>
                    <div>
                      <p className='font-semibold text-gray-800'>{boy.name}</p>
                      <p className='text-xs text-gray-500'>{boy.mobile ? `+91 ${boy.mobile}` : "Mobile not added"}</p>
                    </div>
                    {boy.mobile && <a href={`tel:${boy.mobile}`} className='text-xs font-semibold text-blue-700'>Call</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!assignedDeliveryBoy && status === "out of delivery" && !currentAssignment && visibleAvailableBoys.length > 0 && (
            <div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
              <p className='font-semibold text-yellow-800'>Available delivery boys</p>
              <div className='mt-3 grid gap-2'>
                {visibleAvailableBoys.map((boy) => (
                  <div key={boy.id} className='flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-yellow-100'>
                    <div>
                      <p className='font-semibold text-gray-800'>{boy.name}</p>
                      <p className='text-xs text-gray-500'>{boy.mobile ? `+91 ${boy.mobile}` : "Mobile not added"}</p>
                    </div>
                    {boy.mobile && <a href={`tel:${boy.mobile}`} className='text-xs font-semibold text-blue-700'>Call</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='flex flex-col items-start md:items-end gap-2'>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${status === "delivered"
            ? "bg-green-100 text-green-700"
            : status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {status}
          </span>

          {status !== "delivered" && (
            <select
              className='border border-gray-300 rounded-lg px-3 py-1 text-sm shadow-sm hover:border-green-400 transition focus:ring-2 focus:ring-green-500 outline-none'
              value={status}
              onChange={(e) => updateStatus(e.target.value as IOrder["status"])}
            >
              {statusOptions.map(st => (
                <option key={st} value={st}>{st.toUpperCase()}</option>
              ))}
            </select>
          )}

          {errorMessage && <p className='max-w-[220px] text-xs text-red-600 text-right'>{errorMessage}</p>}
        </div>
      </div>

      <div className='border-t border-gray-200 mt-3 pt-3'>
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

      <div className='border-t pt-3 mt-3 flex justify-between items-center text-sm font-semibold text-gray-800'>
        <div className='flex items-center gap-2 text-gray-700 text-sm'>
          <Truck size={16} className="text-green-600" />
          <span>Delivery: <span className='text-green-700 font-semibold capitalize'>{status}</span></span>
        </div>
        <div>
          Total: <span className='text-green-700 font-bold'>Rs. {order.totalAmount}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminOrderCard
