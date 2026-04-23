'use client'
import AdminOrderCard from '@/components/AdminOrderCard'
import { getSocket } from '@/lib/socket'

import axios from 'axios'
import { AxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
interface IDeliveryPartner {
    _id?: string
    name: string
    email?: string
    mobile?: string
    image?: string
}

interface IDeliveryAssignment {
    _id:string
    brodcastedTo:IDeliveryPartner[]
    assignedTo?:IDeliveryPartner | null
    status:"brodcasted" | "assigned" | "completed"
}

interface IOrder {
    _id?: string
    user: string
    items:
        {
            grocery: string,
            name: string,
            price: string,
            unit: string,
            image: string
            quantity: number
        }[]
    isPaid: boolean
    totalAmount: number,
    paymentMethod: "cod" | "online"
    address: {
        fullName: string,
        mobile: string,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude: number,
        longitude: number
    }
    assignment?: string | IDeliveryAssignment
    assignedDeliveryBoy?: IDeliveryPartner
    status: "pending" | "out of delivery" | "delivered",
    createdAt?: Date
    updatedAt?: Date
}

interface IStatusEvent {
    orderId:string
    status:IOrder["status"]
}

interface IAssignedEvent {
    orderId:string
    assignedDeliveryBoy:IDeliveryPartner
}

interface IAssignmentEvent {
    assignmentId:string
    orderId?:string
    status:IDeliveryAssignment["status"]
    brodcastedTo:IDeliveryPartner[]
}

function ManageOrders() {
    const [orders,setOrders]=useState<IOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const router=useRouter()

    useEffect(()=>{
      let mounted=true
      const getOrders=async ()=>{
        try {
            const result=await axios.get("/api/admin/get-orders")
            if(mounted){
              setOrders(result.data)
              setErrorMessage("")
            }
        } catch (error) {
           console.log(error)
           if (mounted) {
             const message =
               error instanceof AxiosError
                 ? error.response?.data?.message || error.message
                 : "Could not load orders."
             setErrorMessage(message)
           }
        } finally {
          if (mounted) {
            setLoading(false)
          }
         }
      }
      getOrders()
      return ()=>{
        mounted=false
      }
    },[])


    useEffect(()=>{
     const socket=getSocket()

     const refreshOrders=async ()=>{
      try {
        const result=await axios.get("/api/admin/get-orders")
        setOrders(result.data)
        setErrorMessage("")
      } catch (error) {
        console.log(error)
        const message =
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : "Could not refresh orders."
        setErrorMessage(message)
      }
     }

     const handleNewOrder=(newOrder:IOrder)=>{
      setOrders((prev)=>prev ? [newOrder,...prev] : [newOrder])
      void refreshOrders()
     }

     const handleOrderAssigned=({orderId,assignedDeliveryBoy}:IAssignedEvent)=>{
      setOrders((prev)=>prev?.map((o)=>(
  o._id===orderId?{...o,assignedDeliveryBoy,status:"out of delivery"}:o
)))
      void refreshOrders()
     }

     const handleStatusUpdate=({orderId,status}:IStatusEvent)=>{
      setOrders((prev)=>prev?.map((o)=>(
        o._id===orderId?{...o,status,isPaid:status==="delivered" ? true : o.isPaid}:o
      )))
      void refreshOrders()
     }

     const handleAssignmentUpdated=(data:IAssignmentEvent)=>{
      setOrders((prev)=>prev?.map((o)=>{
        const assignment=typeof o.assignment==="object" ? o.assignment : null
        if(assignment?._id!==data.assignmentId && o._id!==data.orderId)return o
        return {
          ...o,
          assignment: assignment ? {
            ...assignment,
            status:data.status,
            brodcastedTo:data.brodcastedTo
          } : o.assignment
        }
      }))
      void refreshOrders()
     }

     socket.on("new-order",handleNewOrder)
     socket.on("order-assigned",handleOrderAssigned)
     socket.on("order-status-update",handleStatusUpdate)
     socket.on("assignment-updated",handleAssignmentUpdated)
     return ()=>{
      socket.off("new-order",handleNewOrder)
      socket.off("order-assigned",handleOrderAssigned)
      socket.off("order-status-update",handleStatusUpdate)
      socket.off("assignment-updated",handleAssignmentUpdated)

     }
    },[])
  return (
    <div className='min-h-screen bg-gray-50 w-full'>
      <div className='fixed top-0 left-0 w-full backdrop-blur-lg bg-white/70 shadow-sm border-b z-50'>
<div className='max-w-3xl mx-auto flex items-center gap-4 px-4 py-3'>
 <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition' onClick={()=>router.push("/admin/dashboard")}>
<ArrowLeft size={24} className="text-green-700"/>
 </button>
 <h1 className="text-xl font-bold text-gray-800">Manage Orders</h1>
</div>
</div>
<div className='max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-8'>
<div className='space-y-6'>
{loading && (
    <div className='rounded-2xl border border-gray-200 bg-white p-6 text-sm font-medium text-gray-600 shadow-sm'>
      Loading orders...
    </div>
)}

{!loading && errorMessage && (
    <div className='rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm'>
      {errorMessage}
    </div>
)}

{!loading && !errorMessage && orders.length===0 && (
    <div className='rounded-2xl border border-gray-200 bg-white p-6 text-sm font-medium text-gray-600 shadow-sm'>
      No orders found yet.
    </div>
)}

{!loading && !errorMessage && orders.map((order,index)=>(
    <AdminOrderCard key={order._id || index} order={order}/>
))}
</div>
</div>

    </div>
  )
}

export default ManageOrders
