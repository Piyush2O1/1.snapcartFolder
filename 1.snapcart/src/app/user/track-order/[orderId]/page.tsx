'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, CreditCard, Loader, MapPin, Package, Phone, Send, Sparkle, Truck, UserCheck } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { getSocket } from '@/lib/socket'
import { RootState } from '@/redux/store'

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => <div className='w-full h-[500px] bg-green-50 animate-pulse' />,
})

interface IDeliveryPartner {
  _id?: string
  name: string
  mobile?: string
  email?: string
  location?: {
    type: string
    coordinates: number[]
  }
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
  assignedDeliveryBoy?: IDeliveryPartner
  status: "pending" | "out of delivery" | "delivered"
  createdAt?: Date
}

interface ILocation {
  latitude: number
  longitude: number
}

interface ILocationEvent {
  userId?: string
  location: {
    coordinates?: number[]
    latitude?: number
    longitude?: number
  }
}

interface IChatMessage {
  _id?: string
  roomId?: string
  text: string
  senderId: string
  time: string
}

interface IStatusEvent {
  orderId: string
  status: IOrder["status"]
}

interface IAssignedEvent {
  orderId: string
  assignedDeliveryBoy: IDeliveryPartner
}

const emptyLocation: ILocation = { latitude: 0, longitude: 0 }
const orderRefreshIntervalMs = 1500

function TrackOrder() {
  const { userData } = useSelector((state: RootState) => state.user)
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = useMemo(() => params.orderId, [params.orderId])

  const [order, setOrder] = useState<IOrder | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<ILocation>(emptyLocation)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>(emptyLocation)

  const loadOrder = useCallback(async (showLoader = false) => {
    if (!orderId) return

    if (showLoader) {
      setPageLoading(true)
    }

    try {
      setPageError("")
      const result = await axios.get(`/api/user/get-order/${orderId}`)
      const loadedOrder = result.data as IOrder
      setOrder(loadedOrder)
      setUserLocation({
        latitude: loadedOrder.address.latitude,
        longitude: loadedOrder.address.longitude,
      })

      const coordinates = loadedOrder.assignedDeliveryBoy?.location?.coordinates
      setDeliveryBoyLocation(
        coordinates?.length
          ? {
              latitude: coordinates[1] ?? 0,
              longitude: coordinates[0] ?? 0,
            }
          : emptyLocation,
      )
    } catch (error) {
      if (showLoader) {
        if (axios.isAxiosError(error)) {
          setPageError(error.response?.data?.message || "Unable to load order")
        } else {
          setPageError("Unable to load order")
        }
      } else {
        console.log(error)
      }
    } finally {
      if (showLoader) {
        setPageLoading(false)
      }
    }
  }, [orderId])

  useEffect(() => {
    void loadOrder(true)
  }, [loadOrder])

  useEffect(() => {
    if (!orderId || order?.status === "delivered") return

    const interval = window.setInterval(() => {
      void loadOrder(false)
    }, orderRefreshIntervalMs)

    return () => window.clearInterval(interval)
  }, [loadOrder, order?.status, orderId])

  useEffect(() => {
    if (!orderId) return

    const socket = getSocket()

    const handleStatusUpdate = (data: IStatusEvent) => {
      if (data.orderId === orderId) {
        setOrder((prev) => prev ? { ...prev, status: data.status, isPaid: data.status === "delivered" ? true : prev.isPaid } : prev)
        if (data.status === "delivered") {
          setDeliveryBoyLocation(emptyLocation)
        }
      }
    }

    const handleOrderAssigned = (data: IAssignedEvent) => {
      if (data.orderId !== orderId) return

      setOrder((prev) => prev ? { ...prev, assignedDeliveryBoy: data.assignedDeliveryBoy, status: "out of delivery" } : prev)
      void loadOrder(false)

      const coordinates = data.assignedDeliveryBoy.location?.coordinates
      if (coordinates?.length) {
        setDeliveryBoyLocation({
          latitude: coordinates[1] ?? 0,
          longitude: coordinates[0] ?? 0,
        })
      }
    }

    socket.on("order-status-update", handleStatusUpdate)
    socket.on("order-assigned", handleOrderAssigned)

    return () => {
      socket.off("order-status-update", handleStatusUpdate)
      socket.off("order-assigned", handleOrderAssigned)
    }
  }, [loadOrder, orderId])

  useEffect(() => {
    const partnerId = order?.assignedDeliveryBoy?._id
    if (!partnerId) return

    const socket = getSocket()
    const handleDeliveryLocation = (data: ILocationEvent) => {
      if (data.userId && data.userId !== partnerId) return

      setDeliveryBoyLocation((prev) => ({
        latitude: data.location.coordinates?.[1] ?? data.location.latitude ?? prev.latitude,
        longitude: data.location.coordinates?.[0] ?? data.location.longitude ?? prev.longitude,
      }))
    }

    socket.on("update-deliveryBoy-location", handleDeliveryLocation)

    return () => {
      socket.off("update-deliveryBoy-location", handleDeliveryLocation)
    }
  }, [order?.assignedDeliveryBoy?._id])

  useEffect(() => {
    if (!orderId) return
    const socket = getSocket()
    const joinRoom = () => {
      socket.emit("join-room", orderId)
    }

    joinRoom()
    socket.on("connect", joinRoom)

    const handleSendMessage = (message: IChatMessage) => {
      if (message.roomId?.toString() === orderId) {
        setMessages((prev) => [...prev, message])
      }
    }

    socket.on("send-message", handleSendMessage)

    return () => {
      socket.off("connect", joinRoom)
      socket.off("send-message", handleSendMessage)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId) return

    const getAllMessages = async () => {
      try {
        const result = await axios.post("/api/chat/messages", { roomId: orderId })
        setMessages(result.data)
      } catch (error) {
        console.log(error)
      }
    }

    getAllMessages()
  }, [orderId])

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  const sendMsg = () => {
    if (!newMessage.trim() || !orderId || !userData?._id) return
    const socket = getSocket()
    const message = {
      roomId: orderId,
      text: newMessage.trim(),
      senderId: userData?._id,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
    socket.emit("send-message", message)
    setNewMessage("")
  }

  const getSuggestion = async () => {
    setSuggestionLoading(true)
    try {
      const lastMessage = messages.filter(m => m.senderId.toString() !== userData?._id).at(-1)
      if (!lastMessage?.text) {
        setSuggestions([])
        return
      }
      const result = await axios.post("/api/chat/ai-suggestions", { message: lastMessage.text, role: "user" })
      setSuggestions(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.log(error)
    } finally {
      setSuggestionLoading(false)
    }
  }

  if (pageLoading) {
    return <div className='min-h-screen flex items-center justify-center text-gray-600'>Loading order...</div>
  }

  if (pageError || !order) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center text-center px-6'>
        <p className='font-semibold text-red-600'>{pageError || "Order not found"}</p>
        <button className='mt-4 rounded-full bg-green-600 px-5 py-2 text-white font-semibold' onClick={() => router.push("/user/orders")}>
          Back to My Orders
        </button>
      </div>
    )
  }

  const partner = order.assignedDeliveryBoy

  return (
    <div className='w-full min-h-screen bg-linear-to-b from-green-50 to-white'>
      <div className='max-w-2xl mx-auto pb-24'>
        <div className='sticky top-0 bg-white/80 backdrop-blur-xl p-4 border-b shadow flex gap-3 items-center z-999'>
          <button className='p-2 bg-green-100 rounded-full' onClick={() => router.push("/user/orders")}>
            <ArrowLeft className="text-green-700" size={20} />
          </button>
          <div>
            <h2 className='text-xl font-bold'>Track Order</h2>
            <p className='text-sm text-gray-600'>Order #{order._id?.toString().slice(-6)} <span className='text-green-700 font-semibold capitalize'>{order.status}</span></p>
          </div>
        </div>

        <div className='px-4 mt-6 space-y-4'>
          <div className='bg-white rounded-3xl shadow border p-4 space-y-3'>
            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <MapPin className='text-green-700' size={16} />
              {order.address.fullAddress}
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <Package className='text-green-700' size={16} />
              {order.items.length} items | Rs. {order.totalAmount}
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-700'>
              {order.paymentMethod === "cod" ? <Truck className='text-green-700' size={16} /> : <CreditCard className='text-green-700' size={16} />}
              {order.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"} | {order.isPaid || order.status === "delivered" ? "Paid" : "Unpaid"}
            </div>
          </div>

          {partner ? (
            <div className='bg-blue-50 border border-blue-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <UserCheck className='text-blue-600' size={22} />
                <div>
                  <p className='font-semibold text-gray-800'>Delivery partner: {partner.name}</p>
                  <p className='text-xs text-gray-600'>{partner.mobile ? `Phone: +91 ${partner.mobile}` : "Phone not added"}</p>
                </div>
              </div>
              {partner.mobile && (
                <a href={`tel:${partner.mobile}`} className='inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'>
                  <Phone size={16} /> Call
                </a>
              )}
            </div>
          ) : (
            <div className='bg-yellow-50 border border-yellow-200 rounded-3xl p-4 text-sm text-yellow-800'>
              Delivery partner is not assigned yet.
            </div>
          )}

          {partner && (
            <div className='rounded-3xl overflow-hidden border shadow'>
              <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
            </div>
          )}

          {partner && (
            <div className='bg-white rounded-3xl shadow-lg border p-4 h-[430px] flex flex-col'>
              <div className='flex justify-between items-center mb-3'>
                <span className='font-semibold text-gray-700 text-sm'>Quick Replies</span>
                <motion.button
                  disabled={suggestionLoading}
                  whileTap={{ scale: 0.9 }}
                  className="px-3 py-1 text-xs flex items-center gap-1 bg-purple-100 text-purple-700 rounded-full shadow-sm border border-purple-200 cursor-pointer"
                  onClick={getSuggestion}
                >
                  <Sparkle size={14} />{suggestionLoading ? <Loader className="w-5 h-5 animate-spin" /> : "AI suggest"}
                </motion.button>
              </div>

              <div className='flex gap-2 flex-wrap mb-3'>
                {suggestions.map((s, i) => (
                  <motion.div
                    key={`${s}-${i}`}
                    whileTap={{ scale: 0.92 }}
                    className="px-3 py-1 text-xs bg-green-50 border border-green-200 cursor-pointer text-green-700 rounded-full"
                    onClick={() => setNewMessage(s)}
                  >
                    {s}
                  </motion.div>
                ))}
              </div>

              <div className='flex-1 overflow-y-auto p-2 space-y-3' ref={chatBoxRef}>
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg._id?.toString() || `${msg.time}-${index}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.senderId.toString() === userData?._id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`px-4 py-2 max-w-[75%] rounded-2xl shadow ${msg.senderId.toString() === userData?._id
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}>
                        <p>{msg.text}</p>
                        <p className='text-[10px] opacity-70 mt-1 text-right'>{msg.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className='flex gap-2 mt-3 border-t pt-3'>
                <input type="text" placeholder='Type a Message...' className='flex-1 bg-gray-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500' value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button className='bg-green-600 hover:bg-green-700 p-3 rounded-xl text-white' onClick={sendMsg}><Send size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackOrder
