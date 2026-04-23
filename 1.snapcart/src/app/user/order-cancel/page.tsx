'use client'

import { ArrowLeft, Home, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'

function OrderCancel() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  useEffect(() => {
    const cleanupCancelledOrder = async () => {
      if (!orderId) return

      try {
        await axios.post("/api/user/payment/cancel", { orderId })
      } catch (error) {
        console.log(error)
      }
    }

    void cleanupCancelledOrder()
  }, [orderId])

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-red-50 to-white px-6 text-center'>
      <h1 className='text-3xl font-bold text-red-600'>Payment Cancelled</h1>
      <p className='mt-3 max-w-md text-gray-600'>
        Your online payment was not completed. You can go back to cart or continue shopping.
      </p>
      <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
        <Link href='/user/cart' className='inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700'>
          <ShoppingCart size={18} /> Back to Cart
        </Link>
        <Link href='/user/dashboard' className='inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-gray-700 shadow hover:bg-gray-50'>
          <Home size={18} /> Home
        </Link>
        <Link href='/user/orders' className='inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-green-700 hover:text-green-800'>
          <ArrowLeft size={18} /> My Orders
        </Link>
      </div>
    </div>
  )
}

export default OrderCancel
