import React from 'react'
import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'

async function DeliveryBoy() {
  await connectDb()
  const session = await auth()
  const deliveryBoyId = session?.user?.id
  const orders = await Order.find({
    assignedDeliveryBoy: deliveryBoyId,
    deliveryOtpVerification: true,
  })

  const now = new Date()
  const todayKey = now.toDateString()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const todayOrders = orders.filter((o) => new Date(o.deliveredAt).toDateString() === todayKey).length
  const weeklyOrders = orders.filter((o) => new Date(o.deliveredAt) >= sevenDaysAgo).length
  const todaysEarning = todayOrders * 40

  return (
    <>
      <DeliveryBoyDashboard
        summary={{
          todayEarning: todaysEarning,
          todayDeliveries: todayOrders,
          weeklyDeliveries: weeklyOrders,
          totalCompleted: orders.length,
        }}
      />
    </>
  )
}

export default DeliveryBoy
