import { getSocket } from '@/lib/socket'
import axios from 'axios'
import { Loader, Send, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

type props = {
  orderId: string
  deliveryBoyId: string
}

interface IChatMessage {
  _id?: string
  roomId?: string
  text: string
  senderId: string
  time: string
}

function DeliveryChat({ orderId, deliveryBoyId }: props) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<IChatMessage[]>([])
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
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

  const sendMsg = () => {
    if (!newMessage.trim() || !deliveryBoyId) return
    const socket = getSocket()

    const message = {
      roomId: orderId,
      text: newMessage.trim(),
      senderId: deliveryBoyId,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
    socket.emit("send-message", message)

    setNewMessage("")
  }

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  useEffect(() => {
    const getAllMessages = async () => {
      try {
        const result = await axios.post("/api/chat/messages", { roomId: orderId })
        setMessages(Array.isArray(result.data) ? result.data : [])
      } catch (error) {
        console.log(error)
      }
    }
    void getAllMessages()
  }, [orderId])

  const getSuggestion = async () => {
    setLoading(true)
    try {
      const lastMessage = messages.filter((m) => m.senderId.toString() !== deliveryBoyId).at(-1)
      if (!lastMessage?.text) {
        setSuggestions([])
        return
      }
      const result = await axios.post("/api/chat/ai-suggestions", { message: lastMessage.text, role: "delivery_boy" })
      setSuggestions(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[430px] flex-col rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Quick replies</p>
          <p className="text-xs text-slate-500">Use AI suggestions when the customer has already messaged.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={loading}
          onClick={() => void getSuggestion()}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? <Loader className="h-4 w-4 animate-spin" /> : "AI suggestions"}
        </motion.button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            whileTap={{ scale: 0.98 }}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => setNewMessage(suggestion)}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>

      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto rounded-[24px] bg-slate-50/70 p-3" ref={chatBoxRef}>
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg._id?.toString() || `${msg.time}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.senderId.toString() === deliveryBoyId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-[20px] px-4 py-3 shadow-sm ${
                  msg.senderId.toString() === deliveryBoyId
                    ? "bg-slate-950 text-white"
                    : "border border-white/90 bg-white text-slate-800"
                }`}
              >
                <p className="text-sm leading-6">{msg.text}</p>
                <p className="mt-1 text-right text-[10px] opacity-65">{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-300"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              sendMsg()
            }
          }}
        />
        <button
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-emerald-700"
          onClick={sendMsg}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default DeliveryChat
