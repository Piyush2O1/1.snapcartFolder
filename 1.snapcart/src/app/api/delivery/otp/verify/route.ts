import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb()
    const session = await auth()
    const deliveryBoyId = session?.user?.id

    if (!deliveryBoyId || session?.user?.role !== "deliveryBoy") {
      return NextResponse.json(
        { message: "you are not a delivery partner" },
        { status: 403 }
      )
    }

    const { orderId, otp } = await req.json()
    if (!orderId || !otp) {
      return NextResponse.json(
        { message: "orderId or OTP not found" },
        { status: 400 }
      )
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { message: "order not found" },
        { status: 400 }
      )
    }

    if (String(order.assignedDeliveryBoy ?? "") !== deliveryBoyId) {
      return NextResponse.json(
        { message: "this order is not assigned to you" },
        { status: 403 }
      )
    }

    if (!order.deliveryOtp || !order.deliveryOtpExpiresAt) {
      return NextResponse.json(
        { message: "OTP not generated. Please send OTP again." },
        { status: 400 }
      )
    }

    if (order.deliveryOtpExpiresAt.getTime() < Date.now()) {
      order.deliveryOtp = null
      order.deliveryOtpExpiresAt = null
      await order.save()

      return NextResponse.json(
        { message: "OTP expired. Please resend OTP." },
        { status: 400 }
      )
    }

    if (order.deliveryOtp !== String(otp).trim()) {
      return NextResponse.json(
        { message: "Incorrect OTP" },
        { status: 400 }
      )
    }

    order.status = "delivered"
    order.deliveryOtpVerification = true
    order.deliveryOtp = null
    order.deliveryOtpExpiresAt = null
    if (order.paymentMethod === "cod") {
      order.isPaid = true
    }
    order.deliveredAt = new Date()
    await order.save()

    await DeliveryAssignment.updateOne(
      { order: orderId },
      { $set: { assignedTo: null, status: "completed" } }
    )

    await emitEventHandler("order-status-update", { orderId: order._id, status: order.status })

    return NextResponse.json(
      { message: "Delivery successfully completed" },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: `verify otp error ${error}` },
      { status: 500 }
    )
  }
}
